# CodeReview Bot — Formal Specification

**Version:** 1.0  
**Date:** 2026-05-13  
**Author:** Gowthaman Murugan  
**Program:** Anthropic i2i Capstone  
**Status:** Approved for Implementation

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Technical Design](#2-technical-design)
3. [Implementation Plan](#3-implementation-plan)
4. [Scope Boundaries](#4-scope-boundaries)
5. [Success Criteria](#5-success-criteria)
6. [Grading Rubric Cross-Reference](#6-grading-rubric-cross-reference)

---

## 1. Requirements

### 1.1 User Personas

| Persona | Description |
|---------|-------------|
| **Developer** | Opens or updates a pull request; receives automated inline feedback |
| **Repo Admin** | Registers repositories, configures webhooks, manages rules |
| **Team Member** | Views reviews and findings on the dashboard |

---

### 1.2 User Stories with Acceptance Criteria

#### Epic 1 — Webhook Ingestion

---

**US-01 — Receive PR webhook**

> As a Developer, when I open or push to a PR, I want the system to automatically receive the event so that a review is triggered without any manual action.

**Acceptance Criteria:**
- [ ] `POST /api/webhooks/github` returns `200 { received: true }` within 500ms of receiving a valid signed payload
- [ ] A `Review` record is created with `status = PENDING` and correct `prNumber`, `prTitle`, `prUrl`, `headSha`, `baseSha`
- [ ] A background analysis job is enqueued immediately after the Review is created
- [ ] A second webhook for the same `(repositoryId, prNumber, headSha)` does NOT create a duplicate Review (idempotent)
- [ ] Webhook with an invalid or missing `x-hub-signature-256` header returns `401`
- [ ] Webhook for `action = closed` returns `200` but does NOT create a Review or enqueue a job

---

**US-02 — Webhook security**

> As a Repo Admin, I want GitHub webhook payloads to be cryptographically verified so that only legitimate GitHub events trigger analysis.

**Acceptance Criteria:**
- [ ] HMAC-SHA256 verification uses `timingSafeEqual` (no string equality)
- [ ] Raw request body is read as text before parsing (signature covers raw bytes)
- [ ] Each repository has its own `webhookSecret`; a compromised secret for one repo does not affect others
- [ ] Payloads larger than 25MB are rejected with `413`

---

#### Epic 2 — Automated PR Analysis

---

**US-03 — Security analysis**

> As a Developer, I want the system to flag security vulnerabilities in my PR so that I can fix them before merging.

**Acceptance Criteria:**
- [ ] Analysis detects at minimum: SQL injection patterns, hardcoded secrets, XSS vectors, path traversal patterns, missing auth checks
- [ ] Each finding includes: `filePath`, `lineStart`, `severity` (CRITICAL/ERROR/WARNING/INFO), `category = SECURITY`, `message`, optional `suggestion`
- [ ] Findings are persisted as `Finding` rows linked to the `Review`

---

**US-04 — Performance analysis**

> As a Developer, I want performance issues identified in my PR so that I don't accidentally introduce regressions.

**Acceptance Criteria:**
- [ ] Analysis detects at minimum: N+1 query patterns, missing pagination, synchronous I/O in async context
- [ ] Each finding includes `category = PERFORMANCE` and a human-readable `suggestion`

---

**US-05 — Style analysis**

> As a Developer, I want style and convention violations flagged so that my code stays consistent with the team's standards.

**Acceptance Criteria:**
- [ ] Analysis detects at minimum: `any` type usage, missing return types on exports, console statements, naming convention violations
- [ ] Each finding includes `category = STYLE`

---

**US-06 — AI-powered analysis**

> As a Developer, I want Claude AI to catch complex issues that simple pattern matching cannot detect.

**Acceptance Criteria:**
- [ ] Claude API (`claude-sonnet-4-6`) is called for each analysis job with changed file content
- [ ] Claude uses tool use (structured JSON) to return findings — no free-text parsing required
- [ ] System prompt + rule list uses prompt caching (`cache_control: ephemeral`)
- [ ] Claude-generated findings are merged with deterministic scanner findings before persisting

---

**US-07 — Inline GitHub review comments**

> As a Developer, I want findings posted as inline comments on my GitHub PR so that I can see them in context without leaving GitHub.

**Acceptance Criteria:**
- [ ] After analysis completes, `create_pull_request_review` is called via GitHub MCP
- [ ] Each Finding maps to an inline comment at the correct file + line
- [ ] The review summary includes finding counts by severity
- [ ] If analysis fails, the PR receives a single comment indicating failure (no silent failures)

---

**US-08 — Review status tracking**

> As a Developer, I want to know whether my PR analysis is pending, running, or complete so that I can check back at the right time.

**Acceptance Criteria:**
- [ ] Review status transitions: `PENDING → IN_PROGRESS → COMPLETED` (or `FAILED`)
- [ ] Status is visible on the dashboard review list as a color-coded badge
- [ ] Status persists correctly across page reloads

---

#### Epic 3 — Dashboard

---

**US-09 — View review list**

> As a Team Member, I want to see a list of all PR reviews so that I can track code quality across the team.

**Acceptance Criteria:**
- [ ] `/reviews` page loads within 3 seconds and shows paginated list of reviews
- [ ] Each row shows: PR title (linked), repository name, status badge, finding count, date
- [ ] Filters work: status, repository, date range
- [ ] Filter state is reflected in the URL (shareable links)
- [ ] Empty state message shown when no reviews match filters

---

**US-10 — View review detail**

> As a Team Member, I want to drill into a specific review to see all findings with their exact locations.

**Acceptance Criteria:**
- [ ] `/reviews/[id]` shows PR title, status, summary, and findings list
- [ ] Findings can be filtered by severity and category
- [ ] Each FindingCard shows: severity badge, category badge, `filePath:lineStart`, message, collapsible suggestion
- [ ] Page shows empty state when review has zero findings

---

**US-11 — Manage repositories**

> As a Repo Admin, I want to register and configure repositories so that the system knows which repos to analyze.

**Acceptance Criteria:**
- [ ] Admin can add a repository with `fullName` and `webhookSecret`
- [ ] Repository list shows active status, last review date, and review count
- [ ] Admin can deactivate a repository (stops processing new webhooks for it)
- [ ] Admin can update the webhook secret without deleting the repository

---

**US-12 — Manage analysis rules**

> As a Repo Admin, I want to create, enable/disable, and tune analysis rules so that findings are relevant to my team.

**Acceptance Criteria:**
- [ ] Admin can create a global rule (applies to all repos) or a repo-scoped rule (overrides global)
- [ ] Admin can enable/disable any rule with a toggle
- [ ] Admin can set severity (INFO/WARNING/ERROR/CRITICAL) per rule
- [ ] Admin can provide a regex pattern for deterministic matching
- [ ] Disabled rules produce zero findings

---

**US-13 — Manage team members**

> As a Repo Admin, I want to invite team members and assign roles so that the right people have the right access.

**Acceptance Criteria:**
- [ ] Admin can invite a user by GitHub login
- [ ] Roles: ADMIN (full access), MEMBER (view + filter), VIEWER (read-only)
- [ ] Only ADMINs can invite, change roles, or remove members
- [ ] Removing a member revokes their access immediately (next request returns 403)

---

#### Epic 4 — Authentication & Security

---

**US-14 — GitHub OAuth sign-in**

> As any user, I want to sign in with my GitHub account so that I don't need a separate password.

**Acceptance Criteria:**
- [ ] `/login` page shows a "Sign in with GitHub" button
- [ ] Successful OAuth creates a User record if first login (upsert by `githubId`)
- [ ] Failed or cancelled OAuth redirects back to `/login` with an error message
- [ ] All dashboard routes (`/reviews`, `/repositories`, `/rules`, `/team`) redirect to `/login` if unauthenticated

---

**US-15 — Data isolation**

> As a user, I want to be certain I can only see data I am authorized to view.

**Acceptance Criteria:**
- [ ] All DB queries for repositories, reviews, findings, rules filter by the authenticated user's `userId` or membership
- [ ] Requesting another user's repository ID returns `404` (not `403`, to avoid confirming existence)
- [ ] ADMIN-only endpoints return `403` for MEMBER/VIEWER roles

---

## 2. Technical Design

### 2.1 Data Model Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌──────────┐
│    User     │──1:N──│   Repository     │──1:N──│  Review  │
│─────────────│       │──────────────────│       │──────────│
│ id (cuid)   │       │ id (cuid)        │       │ id       │
│ githubId    │       │ githubRepoId     │       │ prNumber │
│ email       │       │ fullName         │       │ prTitle  │
│ name        │       │ owner            │       │ prUrl    │
│ avatarUrl   │       │ name             │       │ headSha  │
│ createdAt   │       │ installationId   │       │ baseSha  │
│ updatedAt   │       │ webhookSecret    │       │ status ──┼──► PENDING
└──────┬──────┘       │ isActive         │       │ summary  │    IN_PROGRESS
       │              │ ownerId ─────────┼──────►│ repoId   │    COMPLETED
       │              │ createdAt        │       │ authorId │    FAILED
       │1:N           │ updatedAt        │       │createdAt │
       │              └────────┬─────────┘       └────┬─────┘
       │                       │                       │1:N
       │              ┌────────┴──────┐          ┌─────▼──────┐
       │              │   TeamMember  │          │  Finding   │
       │              │───────────────│          │────────────│
       │              │ id            │          │ id         │
       └──────────────┤ userId        │          │ filePath   │
            1:N       │ repositoryId  │          │ lineStart  │
                      │ role ─────────┼──►ADMIN  │ lineEnd    │
                      │ createdAt     │   MEMBER  │ severity ──┼──► INFO
                      │ @@unique      │   VIEWER  │ category ──┼──► WARNING
                      │ [userId,repoId]│          │ message    │    ERROR
                      └───────────────┘          │ suggestion │    CRITICAL
                                                 │ ruleId     │
                      ┌────────────────┐         │ reviewId   │
                      │     Rule       │◄────────┤ createdAt  │
                      │────────────────│  0:N    └────────────┘
                      │ id             │
                      │ name           │   category: SECURITY
                      │ description    │             PERFORMANCE
                      │ category       │             STYLE
                      │ severity       │             CORRECTNESS
                      │ isEnabled      │
                      │ pattern        │
                      │ repositoryId ──┼──► null = global rule
                      │ createdAt      │    set  = repo-scoped
                      │ updatedAt      │
                      └────────────────┘
```

**Unique Constraints:**
- `Review.@@unique([repositoryId, prNumber, headSha])` — idempotency key; prevents duplicate webhook re-processing
- `TeamMember.@@unique([userId, repositoryId])` — one role per user per repo
- `Repository.githubRepoId @unique` — one registration per GitHub repo
- `User.githubId @unique`, `User.email @unique`

---

### 2.2 API Contracts

#### Base URL: `/api`

All authenticated endpoints require a valid session cookie (set by NextAuth after GitHub OAuth).

**Standard response envelope:**

```
Success (single):  { data: T }
Success (list):    { data: T[], meta: { page, limit, total } }
Error:             { error: string, issues?: ZodFlattenedError }
```

#### Webhook

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/github` | HMAC sig | Ingest GitHub PR event |

Request headers: `x-hub-signature-256`, `x-github-event`  
Response: `200 { received: true }`  
Error responses: `401` (bad/missing sig), `413` (payload > 25MB), `422` (Zod fail)

#### Repositories

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/repositories` | Session | Any |
| POST | `/api/repositories` | Session | Any |
| GET | `/api/repositories/[id]` | Session | Member+ |
| PATCH | `/api/repositories/[id]` | Session | Owner |
| DELETE | `/api/repositories/[id]` | Session | Owner |

**POST body:**
```ts
{ githubRepoId: number, fullName: string, installationId: number, webhookSecret: string }
```

**PATCH body:**
```ts
{ webhookSecret?: string, isActive?: boolean }
```

#### Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reviews` | Session | List (filter: repoId, status, page, limit) |
| GET | `/api/reviews/[id]` | Session | Detail + nested findings |
| GET | `/api/reviews/[id]/findings` | Session | Paginated findings (filter: severity, category, filePath) |
| DELETE | `/api/reviews/[id]` | Session | Delete + cascade findings |

#### Rules

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/rules` | Session | List (filter: repositoryId, category) |
| POST | `/api/rules` | Session | Create global or repo-scoped rule |
| GET | `/api/rules/[id]` | Session | Rule detail |
| PATCH | `/api/rules/[id]` | Session | Update severity, isEnabled, pattern |
| DELETE | `/api/rules/[id]` | Session | Delete rule |

**POST body:**
```ts
{ name: string, description?: string, category: FindingCategory, severity?: Severity, pattern?: string, repositoryId?: string }
```

#### Team

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/repositories/[id]/members` | Session | Member+ |
| POST | `/api/repositories/[id]/members` | Session | Admin |
| PATCH | `/api/repositories/[id]/members/[userId]` | Session | Admin |
| DELETE | `/api/repositories/[id]/members/[userId]` | Session | Admin |

#### Auth

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth GitHub OAuth handler |

**Total endpoints: 21**

---

### 2.3 Component Tree

```
App
├── (auth) group
│   └── /login
│         └── LoginPage
│               └── SignInWithGitHubButton
│
└── (dashboard) group — auth-guarded via middleware
      ├── layout.tsx
      │     └── DashboardLayout
      │           ├── Sidebar
      │           │     ├── Logo
      │           │     ├── NavLink[Reviews]
      │           │     ├── NavLink[Repositories]
      │           │     ├── NavLink[Rules]
      │           │     ├── NavLink[Team]
      │           │     └── UserMenu → { Avatar, SignOutButton }
      │           └── {children}
      │
      ├── /reviews → ReviewListPage
      │     ├── PageHeader
      │     ├── ReviewFilters → { StatusSelect, RepositorySelect, DateRangePicker }
      │     ├── ReviewTable
      │     │     └── ReviewRow[] → { StatusBadge, PRTitle, RepoName, FindingsCount, CreatedAt }
      │     ├── EmptyState
      │     └── Pagination
      │
      ├── /reviews/[id] → ReviewDetailPage
      │     ├── ReviewHeader → { PRTitle, PRLink, StatusBadge, ReviewSummary }
      │     ├── ReviewMeta → { Repository, Author, HeadSha, Timestamps }
      │     ├── FindingFilters → { SeveritySelect, CategorySelect, FilePathSearch }
      │     ├── FindingsList
      │     │     └── FindingCard[] → { SeverityBadge, CategoryBadge, FileLocation, Message, Suggestion }
      │     └── EmptyState
      │
      ├── /repositories → RepositoryListPage
      │     ├── PageHeader + AddRepositoryButton
      │     ├── AddRepositoryModal → { Input[fullName], Input[webhookSecret], Submit }
      │     ├── RepositoryTable
      │     │     └── RepositoryRow[] → { RepoName, ActiveBadge, LastReview, ActionsMenu }
      │     └── EmptyState
      │
      ├── /repositories/[id] → RepositoryDetailPage
      │     └── (summary of repo stats + recent reviews)
      │
      ├── /repositories/[id]/settings → RepositorySettingsPage
      │     ├── WebhookConfigCard → { WebhookSecretInput, ActiveToggle }
      │     └── RuleOverridesTable
      │           └── RuleOverrideRow[] → { RuleName, SeveritySelect, EnabledToggle }
      │
      ├── /rules → RuleListPage
      │     ├── PageHeader + CreateRuleButton
      │     ├── CreateRuleModal → { Input[name], Textarea[desc], Select[category], Select[severity], Input[pattern], Select[repo] }
      │     ├── RulesTable
      │     │     └── RuleRow[] → { Name, CategoryBadge, SeverityBadge, Scope, EnabledToggle, ActionsMenu }
      │     └── EmptyState
      │
      └── /team → TeamManagementPage
            ├── PageHeader + InviteMemberButton
            ├── InviteMemberModal → { Input[githubLogin], Select[role], Submit }
            ├── MembersTable
            │     └── MemberRow[] → { Avatar, UserName, RoleSelect, RemoveButton }
            └── EmptyState

Shared UI: src/components/ui/
  Button, Badge, Card, Modal, Table, Pagination,
  Select, Input, Textarea, Spinner, EmptyState,
  ErrorBoundary, Avatar

Custom Hooks: src/hooks/
  useReviewFilters, useReviews, useReview,
  useRepositories, useRules, useTeamMembers
```

---

### 2.4 Analysis Engine Flow

```
GitHub Webhook (POST /api/webhooks/github)
        │
        ▼
  Verify HMAC signature
        │
        ▼
  Upsert Review (PENDING)
        │
        ▼
  Enqueue pg-boss job { reviewId, prNumber, headSha, installationId }
        │
        ▼ (background worker)
  Review.status → IN_PROGRESS
        │
        ├──[GitHub MCP]── get_pull_request        → verify PR open
        ├──[GitHub MCP]── get_pull_request_files  → changed files + diffs
        └──[GitHub MCP]── get_file_contents × N   → full file text per file
                │
                ▼
  Apply enabled rules (global + repo-scoped)
        ├── securityScanner.scan()
        ├── performanceAnalyzer.scan()
        └── styleChecker.scan()
                │
                ▼
  [Claude API]── claudeAnalyzer.analyze()   → claude-sonnet-4-6 + tool use
                │                             prompt cache: system + rules
                ▼
  Merge + deduplicate findings
        │
        ▼
  prisma.finding.createMany()
        │
        ▼
  Review.status → COMPLETED + summary
        │
        └──[GitHub MCP]── create_pull_request_review → inline PR comments
```

---

### 2.5 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js + React + TypeScript | 15.x |
| Styling | Tailwind CSS | 3.x |
| Backend | Next.js Route Handlers (App Router) | 15.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16.x |
| Authentication | NextAuth/Auth.js | v5 |
| Job Queue | pg-boss (Postgres-backed) | 10.x |
| AI Analysis | Anthropic Claude API | claude-sonnet-4-6 |
| MCP Integration | GitHub MCP Server | latest |
| Unit/Integration Tests | Vitest + React Testing Library | 2.x |
| E2E Tests | Playwright | 1.x |
| CI/CD | GitHub Actions | — |

---

### 2.6 File Structure

```
my-capstone/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── reviews/[id]/page.tsx
│   │   │   ├── repositories/page.tsx
│   │   │   ├── repositories/[id]/page.tsx
│   │   │   ├── repositories/[id]/settings/page.tsx
│   │   │   ├── rules/page.tsx
│   │   │   └── team/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/github/route.ts
│   │       ├── repositories/route.ts
│   │       ├── repositories/[id]/route.ts
│   │       ├── repositories/[id]/members/route.ts
│   │       ├── repositories/[id]/members/[userId]/route.ts
│   │       ├── reviews/route.ts
│   │       ├── reviews/[id]/route.ts
│   │       ├── reviews/[id]/findings/route.ts
│   │       ├── rules/route.ts
│   │       └── rules/[id]/route.ts
│   ├── components/ui/
│   │   └── Button, Badge, Card, Modal, Table, ...
│   ├── hooks/
│   │   └── useReviews, useRepositories, useRules, ...
│   ├── lib/
│   │   ├── env.ts
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── validate.ts
│   │   ├── queue/analysisQueue.ts
│   │   └── analysis/
│   │       ├── analysisWorker.ts
│   │       ├── mcpClient.ts
│   │       ├── claudeAnalyzer.ts
│   │       ├── securityScanner.ts
│   │       ├── performanceAnalyzer.ts
│   │       ├── styleChecker.ts
│   │       ├── findingBuilder.ts
│   │       └── prompts.ts
│   ├── middleware.ts
│   └── types/schemas/
│       ├── githubWebhookSchema.ts
│       ├── repositorySchemas.ts
│       ├── reviewSchemas.ts
│       ├── ruleSchemas.ts
│       └── teamSchemas.ts
├── tests/e2e/
├── .github/workflows/
├── .env.example
├── .mcp.json
└── docs/
```

---

## 3. Implementation Plan

### 3.1 Ordered Phases with Time Estimates

| Phase | Name | Deliverable | Est. Hours | Depends On |
|-------|------|-------------|------------|------------|
| 0 | Scaffolding | Working Next.js app, Prisma initialized, all deps installed | 2–3 | — |
| 1 | Data Model | Prisma schema, migrations, all 6 tables in DB | 3–4 | 0 |
| 2 | API Design | All 21 route handlers, Zod schemas, validation helper | 5–6 | 1 |
| 3 | Analysis Engine | Worker, scanners, Claude API, pg-boss queue | 6–8 | 2 |
| 4 | MCP Integration | GitHub MCP wired into analysis worker | 4–5 | 3 |
| 5 | Frontend | All 8 pages, component library, custom hooks | 8–10 | 2 |
| 6 | Security | Auth middleware, HMAC verification, row-level authz | 3–4 | 2, 5 |
| 7 | Testing | Unit, integration, E2E test suites | 6–8 | 3, 5 |
| 8 | CI/CD | GitHub Actions pipelines, Dependabot | 2–3 | 7 |
| **Total** | | | **39–51 hrs** | |

---

### 3.2 Phase Details

#### Phase 0 — Scaffolding (2–3 hrs)

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npm install prisma @prisma/client zod next-auth @octokit/webhooks pg-boss @anthropic-ai/sdk
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event playwright
npx prisma init --datasource-provider postgresql
```

Deliverables: `package.json`, `prisma/schema.prisma` (empty), `tsconfig.json` (strict), `.env.example`

#### Phase 1 — Data Model (3–4 hrs)

Author Prisma schema with all 6 models (User, Repository, Review, Finding, Rule, TeamMember), enums, relations, and constraints. Run `prisma migrate dev --name init`.

Gate: `prisma studio` shows all 6 tables with correct columns and FK relationships.

#### Phase 2 — API Design (5–6 hrs)

Implement all 21 route handlers using the Next.js 15 App Router pattern (async params). Author all Zod schemas in `src/types/schemas/`. Build `validate.ts` helper.

Gate: `curl -X POST /api/webhooks/github` with invalid signature returns `401`; with valid signature and correct body returns `200`.

#### Phase 3 — Analysis Engine (6–8 hrs)

Build `analysisWorker.ts` (14-step flow), `securityScanner.ts`, `performanceAnalyzer.ts`, `styleChecker.ts`, `findingBuilder.ts`, and `analysisQueue.ts`. Wire Claude API with tool-use schema and prompt caching.

Gate: Manual test job with seeded Review → Finding rows appear in DB → Review status = COMPLETED.

#### Phase 4 — MCP Integration (4–5 hrs)

Build `mcpClient.ts` wrapping GitHub MCP tools. Configure `.mcp.json`. Wire `get_pull_request_files`, `get_file_contents`, `create_pull_request_review` into the worker.

Gate: Analysis worker posts inline comments on a test PR in a sandbox repo.

#### Phase 5 — Frontend (8–10 hrs)

Build all 8 pages using the component tree from §2.3. Build 13 shared UI components. Build 6 custom hooks. Ensure zero TypeScript errors in `npm run build`.

Gate: Navigate all routes in browser; all pages render without errors; filter state persists in URL.

#### Phase 6 — Security (3–4 hrs)

Implement `middleware.ts` (auth guard). Implement HMAC verification in webhook handler. Enforce row-level ownership checks on all resource queries. Validate all env vars at startup via `src/lib/env.ts`.

Gate: Unauthenticated request to `/api/reviews` returns `401`. Request to another user's resource returns `404`.

#### Phase 7 — Testing (6–8 hrs)

Write unit tests for all scanners, the validate helper, all Zod schemas, and 5 React components. Write integration tests for webhook handler (6 scenarios), Review CRUD, rule application, and job queue. Write 5 Playwright E2E tests.

Gate: `npm run test` passes all tests with ≥80% line/function coverage. `npx playwright test` passes all 5 E2E flows.

#### Phase 8 — CI/CD (2–3 hrs)

Author `.github/workflows/ci.yml` (lint → typecheck → unit → integration → build on push/PR). Author `.github/workflows/e2e.yml` (build → serve → playwright on merge to main). Configure Dependabot.

Gate: A push to a test branch triggers CI; all steps pass green.

---

### 3.3 Build Order (Critical Path)

Files must be created in this order to avoid circular import and migration errors:

1. `prisma/schema.prisma` → run `prisma migrate dev`
2. `src/lib/env.ts` — env validation (no imports from project)
3. `src/lib/db.ts` — Prisma client singleton
4. `src/lib/auth.ts` — NextAuth config
5. `src/lib/validate.ts` — Zod helper
6. `src/types/schemas/` — all Zod DTOs
7. `src/app/api/auth/[...nextauth]/route.ts`
8. `src/middleware.ts`
9. `src/app/api/webhooks/github/route.ts`
10. `src/app/api/repositories/`, `reviews/`, `rules/` route handlers
11. `src/lib/queue/analysisQueue.ts`
12. `src/lib/analysis/` — worker + scanners + Claude client
13. `.mcp.json`
14. `src/components/ui/` — shared UI primitives
15. `src/hooks/` — custom data hooks
16. `src/app/(dashboard)/` — all pages
17. `src/__tests__/unit/` + `src/__tests__/integration/`
18. `tests/e2e/`
19. `.github/workflows/`

---

## 4. Scope Boundaries

### 4.1 In Scope

| Feature | Details |
|---------|---------|
| GitHub PR webhook ingestion | Receives `opened`, `synchronize`, `reopened` events |
| HMAC-SHA256 webhook verification | Per-repository secret, `timingSafeEqual` |
| Automated PR analysis | Security, performance, style, correctness categories |
| Claude AI analysis | `claude-sonnet-4-6` with tool use + prompt caching |
| GitHub MCP integration | Read PR files, post inline review comments |
| Background job processing | pg-boss queue, 3-retry with backoff |
| Review dashboard | List, detail, filter, pagination |
| Repository management | Register, configure, deactivate |
| Rule management | Global and repo-scoped rules, enable/disable |
| Team management | Invite, role assignment (ADMIN/MEMBER/VIEWER) |
| GitHub OAuth authentication | NextAuth v5, JWT sessions |
| Row-level authorization | Tenant isolation, role-based endpoint guards |
| Zod validation | All request bodies and query parameters |
| Unit + integration + E2E tests | Vitest, React Testing Library, Playwright |
| CI/CD | GitHub Actions pipelines |

---

### 4.2 Explicitly Out of Scope

The following are **not** part of this project and should not be implemented or stubbed:

| Feature | Reason Out of Scope |
|---------|-------------------|
| IDE / editor extensions | Separate product surface |
| Real-time collaborative editing | No WebSocket infrastructure planned |
| Self-hosted Git providers (GitLab, Bitbucket) | GitHub-only via GitHub MCP |
| Automatic code fixing or committing | Review-only; no write access to PR branch |
| Full SAST platform (SARIF, CWE taxonomy) | Out of complexity budget |
| Runtime production monitoring (APM) | Different tooling category |
| Dependency vulnerability management | Separate responsibility (Dependabot covers CI) |
| CI runner orchestration | GitHub Actions manages CI; bot does not |
| AI model training or fine-tuning | Uses hosted Claude API |
| Source code hosting | GitHub remains the source of truth |
| Enterprise compliance tooling (SOC2, GDPR exports) | Out of scope for capstone |
| Billing / subscription management | No monetization layer |
| Multi-provider OAuth (Google, email/password) | GitHub only |
| Slack / email notifications | GitHub PR comments are the notification channel |
| Mobile-responsive native apps | Web-only |

---

## 5. Success Criteria

The project is considered complete when **all** of the following criteria pass.

### 5.1 Functional Criteria

| ID | Criterion | How to Verify |
|----|-----------|---------------|
| F-01 | Webhook ingestion is secure and idempotent | POST with valid/invalid HMAC; POST same payload twice |
| F-02 | Analysis runs automatically after webhook | Trigger test PR; confirm Review transitions PENDING → COMPLETED |
| F-03 | Security findings detected | Test PR with known SQL injection pattern; confirm Finding with `category=SECURITY` |
| F-04 | Performance findings detected | Test PR with DB call in loop; confirm Finding with `category=PERFORMANCE` |
| F-05 | Style findings detected | Test PR with `any` type; confirm Finding with `category=STYLE` |
| F-06 | Claude AI findings included | Confirm `claudeAnalyzer` called; structured findings persisted |
| F-07 | Inline GitHub comments posted | Open test PR; verify GitHub App posts review with inline comments |
| F-08 | Dashboard renders review list | Navigate to `/reviews`; confirm list loads with status badges |
| F-09 | Finding detail page renders | Navigate to `/reviews/[id]`; confirm FindingCards render |
| F-10 | Repository management works | Add repo; update webhookSecret; deactivate |
| F-11 | Rule management works | Create global rule; toggle disabled; confirm zero findings |
| F-12 | Team management works | Invite member; change role; remove member |
| F-13 | OAuth sign-in/out works | Sign in with GitHub; sign out; confirm redirect to `/login` |
| F-14 | Data isolation enforced | Unauthenticated request returns 401; cross-tenant request returns 404 |

---

### 5.2 Quality Criteria

| ID | Criterion | Threshold |
|----|-----------|-----------|
| Q-01 | Unit test pass rate | 100% |
| Q-02 | Integration test pass rate | 100% |
| Q-03 | E2E test pass rate | 100% |
| Q-04 | Line coverage | ≥ 80% |
| Q-05 | Function coverage | ≥ 80% |
| Q-06 | Branch coverage | ≥ 75% |
| Q-07 | TypeScript: zero `any` types | `tsc --noEmit` passes with `strict: true` |
| Q-08 | Build succeeds | `next build` exits 0 |
| Q-09 | `npm audit` | Zero high or critical vulnerabilities |
| Q-10 | CI pipeline passes | All GitHub Actions steps green on `main` |

---

### 5.3 Performance Criteria

| ID | Criterion | Threshold |
|----|-----------|-----------|
| P-01 | Webhook handler response time | < 500ms (before enqueue) |
| P-02 | Analysis job completion (small PR) | < 60s for a PR with ≤ 10 changed files |
| P-03 | Dashboard list page load | < 3s with 100 reviews |
| P-04 | Review detail page load | < 2s |

---

### 5.4 Security Criteria

| ID | Criterion | How to Verify |
|----|-----------|---------------|
| S-01 | Webhook HMAC verified with `timingSafeEqual` | Code review of `webhooks/github/route.ts` |
| S-02 | All secrets in env vars; not in source | `git grep -r "ANTHROPIC_API_KEY\|GITHUB_APP_PRIVATE_KEY" src/` returns zero matches |
| S-03 | All API routes validate input with Zod | Send malformed body to each endpoint; confirm 422 |
| S-04 | No raw SQL string interpolation | `git grep -r "queryRawUnsafe"` returns zero matches |
| S-05 | Env var validation at startup | Remove one env var; confirm startup fails with descriptive error |
| S-06 | Row-level data isolation | Request repo owned by another user; confirm 404 |

---

## 6. Grading Rubric Cross-Reference

This section maps each grading criterion from the Anthropic i2i capstone certification to specific sections of this specification and the implementing code.

### 6.1 Rubric Dimensions

| Dimension | Weight | Mapped Spec Sections | Implementing Files |
|-----------|--------|---------------------|-------------------|
| **AI Integration** | 25% | §2.4, §2.2 (Webhook), US-06, US-07 | `src/lib/analysis/claudeAnalyzer.ts`, `src/lib/analysis/mcpClient.ts`, `.mcp.json` |
| **System Design** | 20% | §2.1 (Data Model), §2.2 (API), §2.3 (Component Tree) | `prisma/schema.prisma`, `src/app/api/`, `src/app/(dashboard)/` |
| **Code Quality** | 20% | §5.2 (Quality Criteria), CLAUDE.md conventions | `tsconfig.json` (strict), `src/types/schemas/`, zero `any` types |
| **Testing** | 15% | §3 Phase 7, §5.2 Q-01 through Q-06 | `src/__tests__/`, `tests/e2e/`, `vitest.config.ts`, `playwright.config.ts` |
| **Security** | 10% | §2.2 (Webhook), §5.4 (Security Criteria), US-02, US-14, US-15 | `src/middleware.ts`, `src/lib/env.ts`, HMAC in route handler |
| **Documentation** | 10% | This document + `docs/` directory | `docs/SPEC.md`, `docs/data-model.md`, `docs/api-design.md`, `docs/frontend.md`, `docs/testing.md`, `docs/security.md`, `docs/mcp-integration.md`, `docs/analysis-engine.md` |

---

### 6.2 AI Integration Criteria (25%)

| Rubric Item | What Is Evaluated | Evidence |
|------------|-------------------|---------|
| Claude API usage | Model called with correct parameters; structured output via tool use | `claudeAnalyzer.ts` — `claude-sonnet-4-6`, `tools: [findingTool]` |
| Prompt caching | `cache_control: ephemeral` on stable system prompt + rules | `claudeAnalyzer.ts` — system block with `cache_control` |
| MCP integration | At least one MCP server configured and called | `.mcp.json`, `mcpClient.ts`, 5 GitHub MCP tools used |
| AI output quality | Findings are actionable, non-trivial, include suggestions | `Finding.message` + `Finding.suggestion` fields; Claude prompt engineering in `prompts.ts` |
| Error handling | AI failures do not crash the system; Review marked FAILED gracefully | `analysisWorker.ts` — try/catch → `Review.status = FAILED` |

---

### 6.3 System Design Criteria (20%)

| Rubric Item | What Is Evaluated | Evidence |
|------------|-------------------|---------|
| Data model correctness | Normalized schema, appropriate relations, constraints | `prisma/schema.prisma`, §2.1 |
| API completeness | CRUD for all resources; correct HTTP semantics | §2.2 — 21 endpoints |
| Separation of concerns | Business logic not in route handlers; scanners independent | `src/lib/analysis/` separated from `src/app/api/` |
| Async processing | Long-running analysis not blocking the HTTP response | pg-boss queue decouples webhook → worker |
| Idempotency | Duplicate webhook events do not corrupt state | `@@unique([repositoryId, prNumber, headSha])` |

---

### 6.4 Code Quality Criteria (20%)

| Rubric Item | What Is Evaluated | Evidence |
|------------|-------------------|---------|
| TypeScript strict mode | No `any`, explicit return types on exports | `tsconfig.json` strict, `tsc --noEmit` clean |
| Naming conventions | Per CLAUDE.md conventions throughout | PascalCase components, `use` hooks, UPPER_SNAKE_CASE constants |
| Zod for validation | All inputs validated at the boundary | `src/types/schemas/`, `src/lib/validate.ts` |
| DTOs in `types/` | Shared types not duplicated across modules | `src/types/schemas/` for all request/response shapes |
| No unnecessary complexity | No premature abstractions; no dead code | Code review against CLAUDE.md conventions |

---

### 6.5 Testing Criteria (15%)

| Rubric Item | What Is Evaluated | Evidence |
|------------|-------------------|---------|
| Unit test coverage | ≥ 80% lines/functions for analysis logic and utilities | `vitest.config.ts` thresholds; `npm run test:coverage` |
| Integration tests | Webhook handler idempotency, DB interactions, queue processing | `src/__tests__/integration/` |
| E2E tests | All 5 critical user flows verified in a real browser | `tests/e2e/`, Playwright |
| Test isolation | Tests don't share state; DB truncated between runs | `afterEach` truncate pattern in integration setup |
| CI enforcement | Tests run automatically on every push | `.github/workflows/ci.yml` |

---

### 6.6 Security Criteria (10%)

| Rubric Item | What Is Evaluated | Evidence |
|------------|-------------------|---------|
| Webhook authentication | HMAC-SHA256 with `timingSafeEqual` | `webhooks/github/route.ts` |
| Session authentication | NextAuth middleware protecting all dashboard routes | `src/middleware.ts` |
| Input validation | Zod on all API inputs; 422 on failure | All route handlers |
| Authorization | Row-level filtering; role-based guards | Ownership filter on every DB query |
| Secret management | Env var validation at startup; no secrets in code | `src/lib/env.ts`, `.gitignore` |

---

### 6.7 Documentation Criteria (10%)

| Rubric Item | What Is Evaluated | Evidence |
|------------|-------------------|---------|
| Formal specification | Requirements, design, plan, scope, success criteria | `docs/SPEC.md` (this document) |
| Data model documentation | Schema diagram + design decisions | `docs/data-model.md` |
| API documentation | All endpoints with request/response shapes | `docs/api-design.md` |
| Architecture documentation | Component tree, engine flow, MCP integration | `docs/frontend.md`, `docs/analysis-engine.md`, `docs/mcp-integration.md` |
| Testing documentation | Test strategy, what to test, how to run | `docs/testing.md` |
| Security documentation | Auth, validation, CORS, env var patterns | `docs/security.md` |

---

## Appendix A — Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GITHUB_WEBHOOK_SECRET` | Yes | Default webhook secret (per-repo secrets stored in DB) |
| `GITHUB_APP_ID` | Yes | GitHub App numeric ID |
| `GITHUB_APP_PRIVATE_KEY` | Yes | PEM private key for GitHub App JWT auth |
| `GITHUB_APP_CLIENT_ID` | Yes | OAuth App client ID (for NextAuth) |
| `GITHUB_APP_CLIENT_SECRET` | Yes | OAuth App client secret (for NextAuth) |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT signing secret (min 32 chars) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key (`sk-ant-...`) |
| `TEST_DATABASE_URL` | Dev/CI | Separate Postgres DB for integration tests |

---

## Appendix B — Related Documents

| Document | Path | Purpose |
|----------|------|---------|
| Project spec | `CLAUDE.md` | High-level project description and conventions |
| Data model | `docs/data-model.md` | Full Prisma schema with design decisions |
| API design | `docs/api-design.md` | Endpoint reference with request/response shapes |
| Frontend | `docs/frontend.md` | Component tree, route structure, hooks, props |
| Analysis engine | `docs/analysis-engine.md` | Worker flow, scanner details, finding builder |
| Testing strategy | `docs/testing.md` | Unit, integration, E2E test cases and config |
| Security | `docs/security.md` | Auth, HMAC, CORS, validation, authz patterns |
| MCP integration | `docs/mcp-integration.md` | GitHub MCP tools, Claude API, pg-boss queue |
| Implementation plan | `docs/implementation-plan.md` | Phase summary, scaffolding steps, build order |
