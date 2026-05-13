# Analysis Engine

## Overview

The analysis engine runs as a background job processor. It is triggered by the webhook handler after a Review record is created, and it produces Finding records + posts inline GitHub review comments.

---

## Job Queue: `src/lib/queue/`

**Technology:** `pg-boss` (Postgres-backed queue — no extra infrastructure like Redis needed)

```
src/lib/queue/
  analysisQueue.ts    // enqueue + worker registration
  jobTypes.ts         // AnalysisJobPayload type
```

### Job Payload

```ts
interface AnalysisJobPayload {
  reviewId: string
  repositoryId: string
  prNumber: number
  headSha: string
  baseSha: string
  installationId: number
  owner: string
  repo: string
}
```

### Queue Config

- `retryLimit: 3` — retry failed jobs up to 3 times
- `retryDelay: 30` — 30 second delay between retries
- `expireIn: "1 hour"` — abandon stale jobs

---

## Worker Entry Point: `src/lib/analysis/analysisWorker.ts`

Full processing flow for a single job:

```
1. Fetch Review + Repository from DB
   └─ Validate Review exists and is PENDING/IN_PROGRESS

2. Update Review.status → IN_PROGRESS

3. Generate GitHub App installation token
   └─ Using installationId + GITHUB_APP_PRIVATE_KEY

4. [GitHub MCP] get_pull_request(owner, repo, prNumber)
   └─ Confirm PR is still open; verify headSha matches

5. [GitHub MCP] get_pull_request_files(owner, repo, prNumber)
   └─ Returns: Array<{ filename, patch, status, additions, deletions }>

6. [GitHub MCP] get_file_contents(owner, repo, filename, ref=headSha)
   └─ For each changed file — full text for analysis context

7. Fetch applicable rules from DB:
   └─ Global rules (repositoryId = null, isEnabled = true)
   └─ Repo-scoped rules (repositoryId = current repo, isEnabled = true)

8. Run deterministic scanners:
   ├─ securityScanner.scan(files, rules)
   ├─ performanceAnalyzer.scan(files, rules)
   └─ styleChecker.scan(files, rules)

9. Run Claude AI analysis:
   └─ claudeAnalyzer.analyze(files, rules) → structured findings

10. Merge all findings, deduplicate by (filePath, lineStart, message)

11. prisma.finding.createMany({ data: allFindings })

12. Generate summary string (finding counts by severity/category)

13. Update Review:
    └─ status → COMPLETED
    └─ summary → generated summary

14. [GitHub MCP] create_pull_request_review(owner, repo, prNumber, comments)
    └─ Post all findings as inline GitHub review comments
```

On unhandled error at any step:
- Update Review.status → FAILED
- Log full error with context (reviewId, prNumber, step)

---

## Scanners: `src/lib/analysis/`

### Security Scanner: `securityScanner.ts`

Default rules detect:
- SQL injection patterns (string concatenation in DB calls)
- Hardcoded secrets (API keys, passwords in source)
- XSS vectors (unescaped HTML rendering)
- Insecure deserialization
- Path traversal patterns
- Missing auth checks on route handlers

### Performance Analyzer: `performanceAnalyzer.ts`

Default rules detect:
- N+1 query patterns (DB call inside a loop)
- Missing pagination on list queries
- Synchronous file I/O in async context
- Large data structures constructed on every render
- Missing `useMemo`/`useCallback` on expensive computations

### Style Checker: `styleChecker.ts`

Default rules detect:
- `any` type usage (TypeScript strict mode violation)
- Missing return types on exported functions
- Console statements in production code
- Naming convention violations (per CLAUDE.md conventions)
- Unused imports

---

## Finding Builder: `findingBuilder.ts`

Normalizes raw scanner output into the shape required for `prisma.finding.create`:

```ts
function buildFinding(
  raw: RawFinding,
  reviewId: string,
  ruleId?: string
): Prisma.FindingCreateInput {
  return {
    filePath: raw.filePath,
    lineStart: raw.lineStart,
    lineEnd: raw.lineEnd,
    severity: normalizeSeverity(raw.severity),
    category: normalizeCategory(raw.category),
    message: raw.message,
    suggestion: raw.suggestion,
    review: { connect: { id: reviewId } },
    ...(ruleId ? { rule: { connect: { id: ruleId } } } : {}),
  };
}
```

---

## Claude API Integration: `claudeAnalyzer.ts`

See [mcp-integration.md](./mcp-integration.md#claude-api-integration-srclibanalysisclaudeanalyzerts) for full details.

Key points:
- Model: `claude-sonnet-4-6`
- Uses tool use (structured JSON output) to ensure parseable findings
- System prompt + rule list is prompt-cached (stable content)
- Per-PR file content goes in the user message (variable content)

---

## Verification

1. Trigger a test webhook with a valid PR payload
2. Check DB: `Review.status = "PENDING"` → `"IN_PROGRESS"` → `"COMPLETED"`
3. Check DB: `Finding` rows exist for the review
4. Check GitHub PR: inline review comments posted by the GitHub App
5. Trigger a job with invalid data: verify `Review.status = "FAILED"` and error logged
