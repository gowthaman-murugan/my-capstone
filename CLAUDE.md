# CLAUDE.md

## Project Name

**CodeReview Bot — AI-Powered PR Review Assistant**

---

# Project Description

CodeReview Bot is an AI-powered pull request review platform that integrates with GitHub repositories through webhook events.  
The system automatically analyzes pull requests for:

- Security vulnerabilities
- Performance issues
- Code style and convention violations

The goal is to provide developers with fast, actionable, and low-noise feedback before code is merged.

The platform includes:

- GitHub webhook ingestion
- Automated analysis engine
- Web dashboard for review management
- Team and repository configuration
- Rule management and severity customization
- Historical review tracking

This project is inspired by modern automated review systems such as:
- GitHub Actions
- Anthropic Claude Code Action workflows
- AI-assisted static analysis pipelines

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | NextAuth/Auth.js (planned) |
| Background Jobs | Queue-based async processing |
| AI/Analysis | Internal rule engine + MCP integrations |
| CI/CD | GitHub Actions |
| Testing | Vitest, React Testing Library, Playwright |

---

# Architecture Overview

```text
├── Webhook Handler
│   └── POST /api/webhooks/github
│
├── Analysis Engine
│   ├── Security Scanner
│   ├── Performance Analyzer
│   └── Style Checker
│
├── Web UI
│   ├── Dashboard
│   ├── Review Details
│   ├── Repository Settings
│   └── Team Management
│
├── Database
│   ├── Repository
│   ├── Review
│   ├── Finding
│   ├── Rule
│   └── User
│
├── MCP Integration
│   └── GitHub MCP
│
└── CI/CD
    └── GitHub Actions
```

---

# Coding Conventions

## TypeScript Rules

- Strict mode enabled
- Avoid `any`
- Prefer explicit types for public APIs
- Use Zod for request validation
- Shared DTOs must live in `types/`

---

# Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `ReviewCard.tsx` |
| Hooks | camelCase with `use` | `useReviewFilters.ts` |
| Utility files | camelCase | `formatDate.ts` |
| Route folders | kebab-case | `review-history/` |
| Prisma models | PascalCase | `Finding` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

# Testing Strategy

## Unit Tests

Tools:
- Vitest
- React Testing Library

Coverage:
- Utility functions
- Analysis rules
- React components
- API handlers

---

## Integration Tests

Test:
- Prisma interactions
- API workflows
- Webhook processing
- Queue execution
- MCP integrations

---

## End-to-End Tests

Tool:
- Playwright

Critical flows:
- GitHub webhook ingestion
- Review creation
- Dashboard rendering
- Rule configuration
- Team management

---

# MCP Integration

## Overview

CodeReview Bot uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) to integrate with external services. MCP enables structured, tool-based communication between the application and external APIs without tight coupling.

## Configured MCP Servers

The project root contains `.mcp.json` which configures MCP servers for Claude Code developer tooling:

| Server | Package | Purpose |
|---|---|---|
| `github` | `@modelcontextprotocol/server-github` | Fetch repo metadata, PR details, diffs |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Read/write project files |

## Environment Variables

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx   # Required for GitHub MCP server
```

## Application-Level MCP Usage

The app uses `@modelcontextprotocol/sdk` to call MCP servers programmatically from API routes.

**Client utility:** `src/lib/github-mcp.ts`

| Export | MCP Tool Called | Description |
|---|---|---|
| `fetchGitHubRepoInfo(owner, repo)` | `get_repository` | Live repo metadata (stars, language, description) |
| `fetchGitHubPullRequest(owner, repo, prNumber)` | `get_pull_request` | PR details for review preparation |

**API routes using MCP:**

| Route | Method | Description |
|---|---|---|
| `/api/repositories/[id]/github-info` | GET | Live GitHub repository metadata via MCP |
| `/api/repositories/[id]/pull-requests/[prNumber]` | GET | Live PR details via MCP |

## Architecture

```text
Next.js API Route
      │
      ▼
src/lib/github-mcp.ts   ← MCP Client (StdioClientTransport)
      │
      ▼
npx @modelcontextprotocol/server-github   ← MCP Server subprocess
      │
      ▼
GitHub REST API
```

## Development Setup

1. Set `GITHUB_TOKEN` in your `.env.local`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

2. The `.mcp.json` file is automatically picked up by Claude Code for developer tooling.

3. The MCP SDK (`@modelcontextprotocol/sdk`) is installed as a project dependency — no separate setup needed for the application integration.

## Production Notes

The current implementation spawns an MCP server subprocess per request. For high-traffic production use, consider:
- A persistent MCP server process with a connection pool
- Replacing the stdio transport with an HTTP/SSE MCP server
- Caching responses for read-only GitHub data

---

# Scope Boundaries

## This Project Includes

- GitHub PR webhook ingestion
- Automated PR analysis
- Security/performance/style findings
- Review dashboard
- Team management
- Rule configuration
- Historical review tracking

---

## This Project Does NOT Include

- Full IDE/editor integrations
- Real-time collaborative editing
- Self-hosted Git providers beyond GitHub
- Automatic code fixing/commits
- Full static application security testing platform
- Runtime production monitoring
- Dependency vulnerability management
- CI runner orchestration
- AI model training infrastructure
- Source code hosting
- Enterprise compliance tooling
