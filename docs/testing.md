# Testing Strategy

## Tools

| Layer | Tool |
|-------|------|
| Unit | Vitest + React Testing Library |
| Integration | Vitest + Prisma (real test DB) |
| E2E | Playwright |

---

## Unit Tests: `src/__tests__/unit/`

### Configuration: `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
```

### What to Test

#### Analysis Rules

| File | Test cases |
|------|-----------|
| `securityScanner.ts` | Rule matches on SQL injection pattern, XSS pattern, hardcoded secret pattern; no match on clean code; empty diff returns no findings; binary file skipped |
| `performanceAnalyzer.ts` | N+1 query pattern detection; large array in render loop; correct severity assigned |
| `styleChecker.ts` | Naming convention violations detected; correctly formatted code passes |
| `findingBuilder.ts` | Severity normalized from string; category mapped correctly; line numbers preserved |

#### API Utilities

| File | Test cases |
|------|-----------|
| `validate.ts` | Valid body passes; invalid body returns 422 with `issues`; missing required field fails; extra fields stripped |
| `githubWebhookSchema.ts` | Valid payload parses; unsupported action returns error; missing `pull_request` field fails |

#### Utility Functions

| File | Test cases |
|------|-----------|
| `formatDate.ts` | ISO string → human-readable; relative time; edge case: today |
| `truncate.ts` | String shortened at max length; no truncation when under limit |
| `severity.ts` | Severity ordering for sort; color mapping for badge |

#### React Components

| Component | Test cases |
|-----------|-----------|
| `Badge` | Renders correct color class per severity; renders label text |
| `ReviewRow` | Renders PR title; status badge present; findings count displayed |
| `FindingCard` | Severity badge correct; file location shown; suggestion collapsible toggle works |
| `EmptyState` | Renders message prop |
| `Pagination` | Renders correct page count; prev/next buttons call handler |

---

## Integration Tests: `src/__tests__/integration/`

### Setup

- Separate `TEST_DATABASE_URL` env pointing to local Postgres test database
- `beforeAll`: run `prisma migrate deploy` against test DB
- `afterEach`: truncate all tables (order matters for FK constraints)
- `afterAll`: disconnect Prisma client

### What to Test

#### Webhook Handler (`POST /api/webhooks/github`)

| Scenario | Expected |
|---------|---------|
| Valid HMAC signature + PR opened | 200, Review created in DB with PENDING status |
| Invalid signature | 401, no DB change |
| Missing signature header | 401 |
| Duplicate webhook (same repositoryId, prNumber, headSha) | 200, no duplicate Review created (upsert idempotent) |
| Unsupported event action (`closed`) | 200 `{ received: true }`, no Review created |
| Payload fails Zod validation | 422 |

#### Review CRUD

| Scenario | Expected |
|---------|---------|
| Create review + fetch by ID | Finding data matches inserted data |
| Delete review | Cascade deletes all associated Findings |
| List reviews with `status` filter | Only matching status returned |
| List reviews with `repositoryId` filter | Only reviews for that repo returned |

#### Rule Application (end-to-end)

| Scenario | Expected |
|---------|---------|
| Global rule enabled | Applied to all repos in analysis run |
| Repo-scoped rule enabled | Applied only to that repo |
| Rule `isEnabled = false` | Not applied |
| Rule with regex `pattern` | Findings only created when pattern matches |

#### Job Queue

| Scenario | Expected |
|---------|---------|
| Enqueue analysis job | Job appears in queue table |
| Worker processes job | Review status transitions PENDING → IN_PROGRESS → COMPLETED |
| Worker throws error | Review status set to FAILED after max retries |

---

## E2E Tests (Playwright): `tests/e2e/`

### Configuration: `playwright.config.ts`

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  baseURL: "http://localhost:3000",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
  ],
});
```

### Critical Flows

| Flow | Steps | Assert |
|------|-------|--------|
| Webhook ingestion | POST to `/api/webhooks/github` with signed payload | Review row appears in `/reviews` list |
| Review creation + display | Trigger analysis job → navigate to `/reviews/[id]` | Findings cards render with correct severity |
| Dashboard rendering | Sign in via GitHub OAuth → navigate to `/` | Review list loads, no console errors |
| Rule configuration | Navigate to `/rules` → create rule → toggle enabled | Rule appears in list; enabled state persists on reload |
| Team management | Navigate to `/team` → invite member → change role | Member appears in table with correct role |

### Test Fixtures

- `auth.fixture.ts` — bypass OAuth by injecting a mock session cookie for test user
- `db.fixture.ts` — seed test data (repos, reviews, findings) before each test suite

---

## Running Tests

```bash
# Unit + integration
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E
npx playwright test

# E2E with UI
npx playwright test --ui
```
