# CodeReview Bot — Implementation Plan

## Overview

CodeReview Bot is a greenfield AI-powered PR review platform. This document is the master implementation plan. Each section links to a dedicated deep-dive doc.

## Phase Summary

| Phase | Scope | Est. Hours |
|-------|-------|------------|
| 0 | [Project Scaffolding](#phase-0--project-scaffolding) | 2–3 |
| 1 | [Data Model](./data-model.md) | 3–4 |
| 2 | [API Design](./api-design.md) | 5–6 |
| 3 | [Analysis Engine](./analysis-engine.md) | 6–8 |
| 4 | [Frontend Components](./frontend.md) | 8–10 |
| 5 | [Testing Strategy](./testing.md) | 6–8 |
| 6 | [Security](./security.md) | 3–4 |
| 7 | [MCP Integration](./mcp-integration.md) | 4–5 |
| 8 | CI/CD | 2–3 |
| **Total** | | **39–51 hrs** |

---

## Phase 0 — Project Scaffolding

### Steps

1. Bootstrap Next.js 15 app with TypeScript + Tailwind + App Router:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
   ```

2. Install runtime dependencies:
   ```bash
   npm install prisma @prisma/client zod next-auth @octokit/webhooks pg-boss @anthropic-ai/sdk
   ```

3. Install dev dependencies:
   ```bash
   npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event playwright
   ```

4. Initialize Prisma:
   ```bash
   npx prisma init --datasource-provider postgresql
   ```

5. Configure `tsconfig.json` — `strict: true` required.

6. Create `.env.example`:
   ```
   DATABASE_URL=
   GITHUB_WEBHOOK_SECRET=
   GITHUB_APP_ID=
   GITHUB_APP_PRIVATE_KEY=
   NEXTAUTH_SECRET=
   ANTHROPIC_API_KEY=
   ```

### Critical Files Created

- `package.json` (replace bare one)
- `prisma/schema.prisma`
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- `.env.example`

---

## Phase 8 — CI/CD

### `.github/workflows/ci.yml`

Triggers: push + pull_request to `main`

Steps:
1. Install dependencies
2. Lint + type-check (`tsc --noEmit`)
3. Unit tests (`vitest run`)
4. Integration tests with Postgres service container
5. Build (`next build`)

### `.github/workflows/e2e.yml`

Triggers: push to `main`

Steps:
1. Build
2. Start Next.js server
3. Run Playwright tests

### Additional

- `dependabot.yml` — weekly npm dependency updates
- `npm audit` step in CI

---

## Build Order (Critical Files)

Create files in this order to avoid circular dependencies:

1. `prisma/schema.prisma`
2. `src/lib/env.ts` — env var validation with Zod
3. `src/lib/db.ts` — Prisma client singleton
4. `src/lib/validate.ts` — shared Zod helper
5. `src/types/schemas/` — all Zod DTOs
6. `src/app/api/webhooks/github/route.ts`
7. `src/app/api/repositories/`, `reviews/`, `rules/` route handlers
8. `src/lib/queue/analysisQueue.ts`
9. `src/lib/analysis/` — worker + scanners
10. `src/app/(dashboard)/` — all pages + components
11. `src/middleware.ts` — auth guard
12. `src/__tests__/` + `tests/e2e/`
13. `.github/workflows/`
