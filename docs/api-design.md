# API Design

All routes under `src/app/api/`. Next.js 15 App Router.

> **Note:** In Next.js 15, `params` is a `Promise` — always `await params` before destructuring.

---

## Standard Response Shapes

```ts
// Success (single resource)
{ data: T }

// Success (list)
{ data: T[], meta: { page: number, limit: number, total: number } }

// Error
{ error: string, issues?: ZodFlattenedError }
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No content (DELETE) |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role/ownership) |
| 404 | Not found |
| 422 | Validation error (Zod) |
| 500 | Internal server error |

---

## Webhook Endpoint

### `POST /api/webhooks/github`

Ingest GitHub PR webhook events.

**Headers required:**
- `x-hub-signature-256: sha256=<hmac>`
- `x-github-event: pull_request`

**Security flow:**
1. Read raw body as `req.text()` (signature is over raw bytes)
2. Compute `sha256=` HMAC using `timingSafeEqual`
3. Reject with `401` if signature invalid
4. Parse body with `GitHubPREventSchema` (Zod)
5. Filter: only process `action` = `opened | synchronize | reopened`
6. Return `200` immediately for all other events (GitHub retries on non-2xx)
7. Upsert Review record (status: `PENDING`)
8. Enqueue background analysis job

**Response:** `200 { received: true }` (always, after auth — fast ack)

**File:** `src/app/api/webhooks/github/route.ts`

---

## Repository Endpoints

**File:** `src/app/api/repositories/route.ts` and `src/app/api/repositories/[id]/route.ts`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/repositories` | List repos for authenticated user | Required |
| POST | `/api/repositories` | Register a new repository | Required |
| GET | `/api/repositories/[id]` | Repo details + config | Required |
| PATCH | `/api/repositories/[id]` | Update config | Required (owner) |
| DELETE | `/api/repositories/[id]` | Deregister repository | Required (owner) |

### `GET /api/repositories`

Query params: none (returns only repos owned by/member of session user)

Response:
```ts
{
  data: Array<{
    id: string
    fullName: string
    owner: string
    name: string
    isActive: boolean
    createdAt: string
    _count: { reviews: number }
  }>
}
```

### `POST /api/repositories`

Body (validated with `CreateRepositorySchema`):
```ts
{
  githubRepoId: number
  fullName: string        // "owner/repo"
  installationId: number
  webhookSecret: string
}
```

### `PATCH /api/repositories/[id]`

Body (validated with `UpdateRepositorySchema`):
```ts
{
  webhookSecret?: string
  isActive?: boolean
}
```

---

## Review Endpoints

**File:** `src/app/api/reviews/route.ts` and `src/app/api/reviews/[id]/route.ts`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/reviews` | List reviews with filters | Required |
| GET | `/api/reviews/[id]` | Review detail + findings | Required |
| GET | `/api/reviews/[id]/findings` | Paginated findings | Required |
| DELETE | `/api/reviews/[id]` | Delete review | Required (owner) |

### `GET /api/reviews`

Query params (validated with `ReviewListQuerySchema`):
```ts
{
  repositoryId?: string
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
  page?: number    // default 1
  limit?: number   // default 20, max 100
}
```

### `GET /api/reviews/[id]`

Response includes `findings` array nested inside.

### `GET /api/reviews/[id]/findings`

Query params:
```ts
{
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL"
  category?: "SECURITY" | "PERFORMANCE" | "STYLE" | "CORRECTNESS"
  filePath?: string
  page?: number
  limit?: number
}
```

---

## Rule Endpoints

**File:** `src/app/api/rules/route.ts` and `src/app/api/rules/[id]/route.ts`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/rules` | List rules | Required |
| POST | `/api/rules` | Create rule | Required |
| GET | `/api/rules/[id]` | Rule detail | Required |
| PATCH | `/api/rules/[id]` | Update rule | Required |
| DELETE | `/api/rules/[id]` | Delete rule | Required |

### `POST /api/rules`

Body (validated with `CreateRuleSchema`):
```ts
{
  name: string
  description?: string
  category: "SECURITY" | "PERFORMANCE" | "STYLE" | "CORRECTNESS"
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL"  // default WARNING
  pattern?: string
  repositoryId?: string   // omit for global rule
}
```

### `PATCH /api/rules/[id]`

Body (validated with `UpdateRuleSchema`):
```ts
{
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL"
  isEnabled?: boolean
  pattern?: string
  description?: string
}
```

---

## Team Endpoints

**File:** `src/app/api/repositories/[id]/members/route.ts` and `.../[userId]/route.ts`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/repositories/[id]/members` | List team members | Required |
| POST | `/api/repositories/[id]/members` | Invite member | Required (ADMIN) |
| PATCH | `/api/repositories/[id]/members/[userId]` | Update role | Required (ADMIN) |
| DELETE | `/api/repositories/[id]/members/[userId]` | Remove member | Required (ADMIN) |

### `POST /api/repositories/[id]/members`

Body (validated with `InviteMemberSchema`):
```ts
{
  githubLogin: string
  role: "ADMIN" | "MEMBER" | "VIEWER"
}
```

---

## Auth Endpoints (NextAuth)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | GitHub OAuth handler |

**File:** `src/app/api/auth/[...nextauth]/route.ts`

---

## Shared Zod Schemas: `src/types/schemas/`

```
src/types/schemas/
  githubWebhookSchema.ts    // GitHubPREventSchema
  repositorySchemas.ts      // CreateRepositorySchema, UpdateRepositorySchema
  reviewSchemas.ts          // ReviewListQuerySchema, FindingListQuerySchema
  ruleSchemas.ts            // CreateRuleSchema, UpdateRuleSchema
  teamSchemas.ts            // InviteMemberSchema, UpdateMemberSchema
```

## Validation Helper: `src/lib/validate.ts`

```ts
export function validateBody<T>(schema: ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse }

export function validateQuery<T>(schema: ZodSchema<T>, searchParams: URLSearchParams):
  | { success: true; data: T }
  | { success: false; response: NextResponse }
```

Returns `422` with `{ error: "Validation failed", issues: ZodError.flatten() }` on failure.
