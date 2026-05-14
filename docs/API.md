# API Reference

**Base URL:** `http://localhost:3000` (development) / `https://<your-domain>` (production)

**Authentication:** All endpoints (except `/api/auth/*` and `/api/webhooks/*`) require an active session cookie issued by NextAuth. Requests without a valid session receive `401 Unauthorized`.

**Content-Type:** `application/json` for all request bodies and responses.

---

## Common Patterns

### Pagination

List endpoints accept these query parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page`    | integer | 1 | — | Page number (1-indexed) |
| `limit`   | integer | 20 | 100 | Records per page |

**Paginated response envelope:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

### Error Responses

```json
{ "error": "Unauthorized" }              // 401
{ "error": "Forbidden" }                 // 403
{ "error": "Repository not found" }      // 404
{ "error": "Validation failed", "issues": { "field": ["message"] } }  // 400
{ "error": "Internal server error" }     // 500
```

---

## Authentication

### `GET /api/auth/providers`

Returns the configured OAuth providers.

**Response `200`:**
```json
{
  "github": {
    "id": "github",
    "name": "GitHub",
    "type": "oauth",
    "signinUrl": "/api/auth/signin/github",
    "callbackUrl": "/api/auth/callback/github"
  }
}
```

### `GET /api/auth/session`

Returns the current session or `null`.

**Response `200` (authenticated):**
```json
{
  "user": {
    "id": "clx...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "image": "https://avatars.githubusercontent.com/..."
  },
  "expires": "2026-06-13T00:00:00.000Z"
}
```

---

## Repositories

### `GET /api/repositories`

List all repositories registered in the system.

**Query parameters:** `page`, `limit`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "clx1a2b3c4d5e6f7",
      "githubRepoId": 123456789,
      "fullName": "acme/backend",
      "owner": "acme",
      "name": "backend",
      "installationId": 987654,
      "isActive": true,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

---

### `POST /api/repositories`

Register a new repository.

**Request body:**
```json
{
  "githubRepoId": 123456789,
  "fullName": "acme/backend",
  "installationId": 987654,
  "webhookSecret": "super-secret-min-20-chars-long"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `githubRepoId` | integer | positive |
| `fullName` | string | format: `owner/name` |
| `installationId` | integer | positive |
| `webhookSecret` | string | min 20 characters |

**Response `201`:**
```json
{
  "data": {
    "id": "clx1a2b3c4d5e6f7",
    "githubRepoId": 123456789,
    "fullName": "acme/backend",
    "owner": "acme",
    "name": "backend",
    "installationId": 987654,
    "isActive": true,
    "ownerId": "clxuser123",
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

**Response `400` (duplicate):**
```json
{ "error": "Repository already registered" }
```

---

### `GET /api/repositories/:id`

Get a single repository by its internal ID.

**Response `200`:**
```json
{
  "data": {
    "id": "clx1a2b3c4d5e6f7",
    "githubRepoId": 123456789,
    "fullName": "acme/backend",
    "owner": "acme",
    "name": "backend",
    "installationId": 987654,
    "isActive": true,
    "ownerId": "clxuser123",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

**Response `404`:**
```json
{ "error": "Repository not found" }
```

---

### `PATCH /api/repositories/:id`

Update repository settings. **Requires owner.**

**Request body (all fields optional):**
```json
{
  "webhookSecret": "new-secret-min-20-chars",
  "isActive": false
}
```

**Response `200`:**
```json
{ "data": { ...repositoryObject } }
```

**Response `403`:**
```json
{ "error": "Forbidden" }
```

---

### `GET /api/repositories/:id/github-info`

Fetch live repository metadata from GitHub via MCP. **Requires owner or team membership.**

**Response `200`:**
```json
{
  "data": {
    "id": 123456789,
    "fullName": "acme/backend",
    "description": "Backend API service",
    "language": "TypeScript",
    "stargazersCount": 42,
    "forksCount": 7,
    "openIssuesCount": 3,
    "defaultBranch": "main",
    "visibility": "private",
    "htmlUrl": "https://github.com/acme/backend"
  }
}
```

**Response `503`:**
```json
{ "error": "GitHub integration not configured. Set GITHUB_TOKEN to enable MCP." }
```

---

### `GET /api/repositories/:id/pull-requests/:prNumber`

Fetch live PR details from GitHub via MCP. **Requires owner or team membership.**

**Path parameters:**
- `:id` — internal repository ID
- `:prNumber` — GitHub pull request number (positive integer)

**Response `200`:**
```json
{
  "data": {
    "number": 42,
    "title": "feat: add rate limiting",
    "state": "open",
    "htmlUrl": "https://github.com/acme/backend/pull/42",
    "user": "janedoe",
    "createdAt": "2026-05-10T08:00:00.000Z",
    "updatedAt": "2026-05-11T14:30:00.000Z",
    "mergeable": true,
    "additions": 120,
    "deletions": 35,
    "changedFiles": 8
  }
}
```

**Response `400`:**
```json
{ "error": "Invalid PR number" }
```

---

## Team Members

### `GET /api/repositories/:id/members`

List team members for a repository. **Requires owner or any team membership.**

**Response `200`:**
```json
{
  "data": [
    {
      "id": "clxmember123",
      "role": "ADMIN",
      "userId": "clxuser456",
      "repositoryId": "clx1a2b3c4d5e6f7",
      "user": {
        "id": "clxuser456",
        "name": "Bob Smith",
        "email": "bob@example.com",
        "avatarUrl": "https://avatars.githubusercontent.com/...",
        "githubId": "bobsmith"
      }
    }
  ]
}
```

---

### `POST /api/repositories/:id/members`

Invite a user to the repository. **Requires Admin.**

The user must have signed in to CodeReview Bot at least once.

**Request body:**
```json
{
  "githubLogin": "bobsmith",
  "role": "MEMBER"
}
```

| Field | Values |
|-------|--------|
| `role` | `ADMIN`, `MEMBER`, `VIEWER` |

**Response `201`:**
```json
{ "data": { ...teamMemberObject } }
```

**Response `404`:**
```json
{ "error": "User not found. They must sign in to CodeReview Bot before being invited." }
```

---

### `PATCH /api/repositories/:id/members/:userId`

Update a team member's role. **Requires Admin.**

**Request body:**
```json
{ "role": "ADMIN" }
```

**Response `200`:**
```json
{ "data": { ...teamMemberObject } }
```

---

### `DELETE /api/repositories/:id/members/:userId`

Remove a team member. **Requires Admin.** Cannot remove yourself.

**Response `200`:**
```json
{ "success": true }
```

**Response `400`:**
```json
{ "error": "Cannot remove yourself" }
```

---

## Reviews

### `GET /api/reviews`

List pull request reviews.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Records per page (max 100) |
| `repositoryId` | string | Filter by repository ID |
| `status` | string | Filter by status: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "clxreview789",
      "prNumber": 42,
      "prTitle": "feat: add rate limiting",
      "prUrl": "https://github.com/acme/backend/pull/42",
      "headSha": "abc123def456",
      "baseSha": "fff000aaa111",
      "status": "COMPLETED",
      "summary": "Found 2 findings: 1 security issue, 1 style issue.",
      "repositoryId": "clx1a2b3c4d5e6f7",
      "authorId": "clxuser123",
      "createdAt": "2026-05-13T10:00:00.000Z",
      "updatedAt": "2026-05-13T10:05:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 57 }
}
```

---

## Rules

### `GET /api/rules`

List analysis rules.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `limit` | integer | Records per page (max 100) |
| `category` | string | Filter: `SECURITY`, `PERFORMANCE`, `STYLE`, `CORRECTNESS` |
| `repositoryId` | string | Filter by repo (omit for global rules) |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "clxrule001",
      "name": "no-eval",
      "description": "Disallows use of eval() which can lead to code injection",
      "category": "SECURITY",
      "severity": "CRITICAL",
      "isEnabled": true,
      "pattern": "eval\\(",
      "repositoryId": null,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 24 }
}
```

---

### `POST /api/rules`

Create a new analysis rule.

**Request body:**
```json
{
  "name": "no-console-log",
  "description": "Disallows console.log in production code",
  "category": "STYLE",
  "severity": "WARNING",
  "isEnabled": true,
  "pattern": "console\\.log",
  "repositoryId": "clx1a2b3c4d5e6f7"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `name` | string | Yes | — |
| `category` | string | Yes | `SECURITY`, `PERFORMANCE`, `STYLE`, `CORRECTNESS` |
| `severity` | string | Yes | `INFO`, `WARNING`, `ERROR`, `CRITICAL` |
| `isEnabled` | boolean | No | default `true` |
| `pattern` | string | No | Regex pattern for matching |
| `repositoryId` | string | No | If omitted, rule is global |
| `description` | string | No | — |

**Response `201`:**
```json
{ "data": { ...ruleObject } }
```

---

## Webhooks

### `POST /api/webhooks/github`

Receives GitHub App webhook events. **Not authenticated via session — verified by HMAC-SHA256 signature.**

GitHub sends this automatically when a pull request is opened or updated.

**Required headers:**
```
X-GitHub-Event: pull_request
X-Hub-Signature-256: sha256=<hmac>
Content-Type: application/json
```

**Handled events:**
- `pull_request.opened` — triggers new review
- `pull_request.synchronize` — triggers re-analysis of updated PR

**Response `200`:**
```json
{ "received": true }
```

**Response `401`:**
```json
{ "error": "Invalid signature" }
```

---

## Error Code Reference

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request — validation failed or invalid parameters |
| 401 | Unauthenticated — no valid session |
| 403 | Forbidden — authenticated but insufficient permissions |
| 404 | Resource not found |
| 500 | Internal server error |
| 502 | Upstream error (GitHub MCP server returned unexpected data) |
| 503 | Service unavailable (MCP integration not configured) |
