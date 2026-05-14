# Security Audit Report

**Project:** CodeReview Bot  
**Date:** 2026-05-13  
**Auditor:** Claude Code (automated)  
**Scope:** All API endpoints, middleware, configuration, and environment handling

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| HIGH     | 2     | 2     |
| MEDIUM   | 3     | 1     |
| LOW      | 3     | 0     |
| **Total**| **8** | **3** |

---

## Findings

### FINDING-001 — Unbounded Pagination Limit (DoS)

| Field    | Value |
|----------|-------|
| Severity | **HIGH** |
| File     | [src/types/schemas/common.ts](../src/types/schemas/common.ts) |
| Line     | 27–29 |
| Status   | **FIXED** |

**Finding:**  
The `paginationQuerySchema` accepts any positive integer for the `limit` parameter with no upper bound. An authenticated attacker can issue `GET /api/repositories?limit=1000000`, causing the database to attempt to return millions of rows in a single query and exhausting database and application memory.

```ts
// BEFORE (vulnerable)
limit: z.coerce.number().int().positive().default(20),
```

**Fix applied:**  
Added `.max(100)` to cap results at 100 per page.

```ts
// AFTER (fixed)
limit: z.coerce.number().int().positive().max(100).default(20),
```

---

### FINDING-002 — Missing Authorization on Repository-scoped GitHub Endpoints

| Field    | Value |
|----------|-------|
| Severity | **HIGH** |
| File     | [src/app/api/repositories/[id]/github-info/route.ts](../src/app/api/repositories/%5Bid%5D/github-info/route.ts) |
| Line     | 13–41 |
| Status   | **FIXED** |

**Finding:**  
`GET /api/repositories/[id]/github-info` and `GET /api/repositories/[id]/pull-requests/[prNumber]` only check that a session exists (`requireAuth`). They do not verify the requesting user has access to the specific repository. Any authenticated user can enumerate live GitHub data — including private repository metadata and PR details — for any repository registered in the system, even one they have no membership in.

```ts
// BEFORE (vulnerable) — only checks session, not repo membership
const auth = await requireAuth();
if (auth instanceof NextResponse) return auth;
const repoResult = await getRepositoryById(id);
// → immediately uses repoResult without checking if auth user has access
```

**Fix applied:**  
Added `verifyRepoAccess` helper that checks the user is either the repository owner or a team member before returning data.

---

### FINDING-003 — Missing HTTP Security Headers

| Field    | Value |
|----------|-------|
| Severity | **MEDIUM** |
| File     | [next.config.ts](../next.config.ts) |
| Line     | 1–5 |
| Status   | **FIXED** |

**Finding:**  
No security headers are configured. Without headers like `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Content-Security-Policy`, the application is vulnerable to:
- **Clickjacking** — the app can be embedded in a malicious iframe
- **MIME sniffing** — browsers may interpret responses as different content types
- **Information leakage** — the `Referer` header sends the full URL to external resources

**Fix applied:**  
Added `headers()` configuration in `next.config.ts` with a baseline security header set.

---

### FINDING-004 — Review Data Not Scoped to User's Repositories

| Field    | Value |
|----------|-------|
| Severity | **MEDIUM** |
| File     | [src/app/api/reviews/handler.ts](../src/app/api/reviews/handler.ts) |
| Line     | 32–79 |
| Status   | **Open** |

**Finding:**  
`GET /api/reviews` returns reviews across all repositories when filtered by `repositoryId`. The handler does not verify the requesting user is a member of the repository for that `repositoryId`. A user on Team A can pass Team B's repository ID to read their review history if they can guess or enumerate the UUID.

**Recommended fix:**  
Before executing the Prisma query, verify the requesting user (obtained from `requireAuth`) is the owner or a `TeamMember` of the target repository. If no `repositoryId` filter is applied, scope the query to repositories the user belongs to.

```ts
// Add to getReviews before building the where clause:
if (repositoryId) {
  const access = await prisma.teamMember.findFirst({
    where: { repositoryId, userId: requestingUserId },
  });
  const repo = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!access && repo?.ownerId !== requestingUserId) {
    return { success: false, error: 'Forbidden', status: 403 };
  }
}
```

---

### FINDING-005 — No Rate Limiting on Auth or API Endpoints

| Field    | Value |
|----------|-------|
| Severity | **MEDIUM** |
| File     | [src/middleware.ts](../src/middleware.ts) |
| Line     | 1–40 |
| Status   | **Open** |

**Finding:**  
No rate limiting is applied to any endpoint. An attacker can:
- Enumerate repository and user IDs with high-frequency requests
- Spam the `POST /api/repositories` endpoint to flood the database with fake repositories

**Recommended fix:**  
Use an edge-compatible rate limiter (e.g., `@upstash/ratelimit` with Redis, or Vercel's built-in edge rate limiting) in `middleware.ts`. Apply stricter limits to mutation endpoints (POST/PATCH/DELETE) than read endpoints.

---

### FINDING-006 — Webhook Route Bypasses Auth Without Signature Validation

| Field    | Value |
|----------|-------|
| Severity | **LOW** |
| File     | [src/middleware.ts](../src/middleware.ts) |
| Line     | 13–14 |
| Status   | **Open** |

**Finding:**  
The middleware unconditionally skips authentication for all `/api/webhooks/*` paths. While this is required for GitHub to POST webhook events (which cannot carry session cookies), there is currently no webhook handler implementation. When it is added, it **must** validate the GitHub HMAC-SHA256 signature (`X-Hub-Signature-256` header) before processing any payload. Failure to do so would allow anyone to forge webhook events and create arbitrary reviews.

**Required implementation when handler is added:**

```ts
import { createHmac, timingSafeEqual } from 'crypto';

function verifyGitHubSignature(body: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
```

---

### FINDING-007 — Validation Errors Expose Internal Schema Structure

| Field    | Value |
|----------|-------|
| Severity | **LOW** |
| File     | [src/app/api/repositories/route.ts](../src/app/api/repositories/route.ts) |
| Line     | 18–24 |
| Status   | **Open** |

**Finding:**  
On validation failure, the endpoint returns `issues: query.error.flatten().fieldErrors`, which exposes the internal Zod field names and their validation constraints to the client. This gives an attacker a roadmap of the request schema.

**Recommended fix:**  
In production, return only a generic validation error message. In development, the detailed issues can be logged server-side.

```ts
// Replace:
return NextResponse.json({ error: 'Invalid...', issues: query.error.flatten().fieldErrors }, { status: 400 });

// With:
return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
```

---

### FINDING-008 — No Explicit CORS Policy

| Field    | Value |
|----------|-------|
| Severity | **LOW** |
| File     | [next.config.ts](../next.config.ts) |
| Line     | 1–5 |
| Status   | **Open** |

**Finding:**  
Next.js does not set CORS headers on API routes by default. Without an explicit `Access-Control-Allow-Origin` policy, cross-origin requests to `/api/*` may succeed if the browser sends credentialed requests from a page the user has open. This creates a CSRF risk if an attacker tricks an authenticated user into visiting a malicious page that makes requests to the API.

**Recommended fix:**  
Add explicit CORS handling in `middleware.ts` or individual route handlers, restricting `Access-Control-Allow-Origin` to the production domain. NextAuth provides CSRF token protection on its own endpoints but not on custom API routes.

---

## Fixed Vulnerabilities Details

### Fix 1 — Pagination Limit Cap
- **File changed:** `src/types/schemas/common.ts`
- **Change:** `.positive()` → `.positive().max(100)` on the `limit` field
- **Effect:** Limits any list endpoint to returning at most 100 records per request

### Fix 2 — Repository Access Authorization
- **Files changed:** `src/app/api/repositories/[id]/github-info/route.ts`, `src/app/api/repositories/[id]/pull-requests/[prNumber]/route.ts`
- **Change:** Added `verifyRepoAccess` check (owner or team member) before returning GitHub data
- **Effect:** Prevents cross-tenant data access on live GitHub API proxy endpoints

### Fix 3 — HTTP Security Headers
- **File changed:** `next.config.ts`
- **Change:** Added `headers()` export with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`
- **Effect:** Mitigates clickjacking, MIME sniffing, and information leakage attacks

---

## Recommendations (Priority Order)

1. **Implement rate limiting** on all mutation endpoints before production launch
2. **Scope review queries** to the requesting user's repositories (FINDING-004)
3. **Implement GitHub webhook signature verification** when adding the webhook handler (FINDING-006)
4. **Restrict CORS** to production domain (FINDING-008)
5. **Remove validation issue details** from error responses in production (FINDING-007)
