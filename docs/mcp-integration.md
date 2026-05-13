# MCP Integration Plan

## MCP Server: GitHub MCP

**Source:** `github.com/github/github-mcp-server`

**What it enables:**
- Read PR metadata, diff, and changed files from GitHub without custom Octokit plumbing
- Fetch full file content at any commit SHA for deeper analysis context
- Post inline review comments directly back to the PR on GitHub

---

## Configuration: `.mcp.json` (project root)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

For GitHub App authentication (per-installation token), the worker must generate a short-lived installation token and pass it as `GITHUB_TOKEN` when spawning the MCP client.

---

## Tools Used in Analysis Workflow

| MCP Tool | When Called | Purpose |
|----------|-------------|---------|
| `get_pull_request` | Job start | Verify PR is open; get base/head SHA |
| `get_pull_request_files` | Analysis start | Get list of changed files + patch hunks |
| `get_file_contents` | Per changed file (ref=headSha) | Full file content for context beyond the diff |
| `create_pull_request_review` | Analysis complete | Post batch of findings as inline review comments |
| `add_pull_request_review_comment` | Per finding (if batching disabled) | Single inline comment at specific diff line |

---

## Analysis Worker Flow: `src/lib/analysis/analysisWorker.ts`

```
Job received { reviewId, repositoryId, prNumber, headSha, installationId }
  │
  ├─ 1. Fetch Review + Repository from DB
  ├─ 2. Update Review status → IN_PROGRESS
  │
  ├─ 3. [GitHub MCP] get_pull_request(owner, repo, prNumber)
  │       └─ Verify status = open; confirm headSha matches
  │
  ├─ 4. [GitHub MCP] get_pull_request_files(owner, repo, prNumber)
  │       └─ Returns: [{ filename, patch, status }]
  │
  ├─ 5. For each changed file:
  │       └─ [GitHub MCP] get_file_contents(owner, repo, filename, ref=headSha)
  │               └─ Full file text for context
  │
  ├─ 6. Apply enabled rules (global + repo-scoped):
  │       ├─ securityScanner.scan(file, patch, rules)
  │       ├─ performanceAnalyzer.scan(file, patch, rules)
  │       └─ styleChecker.scan(file, patch, rules)
  │
  ├─ 7. [Claude API] claudeAnalyzer.analyze(changedFiles, rules)
  │       └─ claude-sonnet-4-6 with tool use → structured findings
  │
  ├─ 8. prisma.finding.createMany({ data: allFindings })
  │
  ├─ 9. Update Review status → COMPLETED + set summary
  │
  └─ 10. [GitHub MCP] create_pull_request_review(owner, repo, prNumber, comments)
          └─ Posts all findings as inline GitHub review comments
```

On any unhandled error: update Review status → FAILED, log error with context.

---

## Claude API Integration: `src/lib/analysis/claudeAnalyzer.ts`

**Model:** `claude-sonnet-4-6`

**Why Claude for analysis:**
- Understands semantic meaning beyond regex patterns
- Can detect complex security issues (e.g., business logic flaws, auth bypass patterns)
- Generates natural language suggestions for fixes

### Tool Schema (for structured output)

```ts
const findingTool = {
  name: "report_finding",
  description: "Report a code issue found during analysis",
  input_schema: {
    type: "object",
    properties: {
      filePath:   { type: "string" },
      lineStart:  { type: "number" },
      lineEnd:    { type: "number" },
      severity:   { type: "string", enum: ["INFO", "WARNING", "ERROR", "CRITICAL"] },
      category:   { type: "string", enum: ["SECURITY", "PERFORMANCE", "STYLE", "CORRECTNESS"] },
      message:    { type: "string" },
      suggestion: { type: "string" },
    },
    required: ["filePath", "lineStart", "severity", "category", "message"],
  },
};
```

### Prompt Caching Strategy

```ts
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  tools: [findingTool],
  system: [
    {
      type: "text",
      text: SYSTEM_PROMPT + JSON.stringify(enabledRules),
      cache_control: { type: "ephemeral" },  // cache stable system prompt + rules
    },
  ],
  messages: [
    {
      role: "user",
      content: buildAnalysisPrompt(changedFiles),  // variable per PR
    },
  ],
});
```

Prompt caching on the system prompt + rule list (stable across PR analyses) reduces cost and latency significantly.

---

## File Structure: `src/lib/analysis/`

```
src/lib/analysis/
  analysisWorker.ts       // job processor entry point
  mcpClient.ts            // GitHub MCP tool call wrappers
  claudeAnalyzer.ts       // Claude API + tool use
  securityScanner.ts      // deterministic security rule matching
  performanceAnalyzer.ts  // deterministic performance rule matching
  styleChecker.ts         // deterministic style rule matching
  findingBuilder.ts       // normalize raw results → Finding DB records
  prompts.ts              // system prompt and analysis prompt builders
```

---

## Queue: `src/lib/queue/`

Using `pg-boss` (Postgres-backed queue — no Redis needed):

```ts
// src/lib/queue/analysisQueue.ts
import PgBoss from "pg-boss";
import { env } from "@/lib/env";

export const boss = new PgBoss(env.DATABASE_URL);

export async function enqueueAnalysis(payload: AnalysisJobPayload) {
  await boss.send("analysis", payload, { retryLimit: 3, retryDelay: 30 });
}

export async function startWorker() {
  await boss.work("analysis", processAnalysisJob);
}
```

Job payload type:
```ts
interface AnalysisJobPayload {
  reviewId: string
  repositoryId: string
  prNumber: number
  headSha: string
  installationId: number
  owner: string
  repo: string
}
```

---

## GitHub App Setup (Prerequisites)

1. Create a GitHub App at `github.com/settings/apps/new`
2. Permissions needed:
   - Pull requests: Read & Write (to post review comments)
   - Contents: Read (to fetch file contents)
3. Subscribe to `pull_request` webhook events
4. Generate private key → store as `GITHUB_APP_PRIVATE_KEY` env var
5. Install app on target repository → note `installationId`

---

## Verification

After MCP integration is wired:
1. Open a test PR on a sandbox GitHub repository
2. GitHub sends webhook → verify Review row created in DB (status: PENDING)
3. Worker picks up job → verify status transitions to IN_PROGRESS → COMPLETED
4. Finding rows appear in DB
5. GitHub PR shows inline review comments posted by the GitHub App
