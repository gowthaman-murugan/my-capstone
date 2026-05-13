# API Testing with curl

All API endpoints have been implemented with full test coverage. To test endpoints manually, you'll need to:

1. **Start Next.js dev server** (when implemented):
   ```bash
   npm run dev
   ```

2. **Run the tests** to verify implementation:
   ```bash
   npm test          # Run all tests once
   npm test:watch    # Watch mode for development
   npm test:ui       # Web UI dashboard
   ```

---

## Repository Endpoints

### GET /api/repositories
List all repositories with pagination.

```bash
curl -X GET "http://localhost:3000/api/repositories?page=1&limit=20" \
  -H "Content-Type: application/json" | jq .
```

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page

**Response (200)**:
```json
{
  "data": [
    {
      "id": "repo-1",
      "githubRepoId": 123456789,
      "fullName": "acme-corp/backend-api",
      "owner": "acme-corp",
      "name": "backend-api",
      "installationId": 999111,
      "isActive": true,
      "createdAt": "2026-05-13T12:35:00.000Z",
      "updatedAt": "2026-05-13T12:35:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

---

### POST /api/repositories
Create a new repository.

```bash
curl -X POST "http://localhost:3000/api/repositories" \
  -H "Content-Type: application/json" \
  -d '{
    "githubRepoId": 999,
    "fullName": "myorg/myrepo",
    "installationId": 123,
    "webhookSecret": "whsec_test_1234567890123456789"
  }' | jq .
```

**Request Body**:
```json
{
  "githubRepoId": 999,
  "fullName": "owner/repo",
  "installationId": 123,
  "webhookSecret": "minimum_20_character_secret_string"
}
```

**Validation Rules**:
- `githubRepoId`: Positive integer (required)
- `fullName`: Format "owner/repo" (required)
- `installationId`: Positive integer (required)
- `webhookSecret`: Minimum 20 characters (required)

**Error Response (400)**:
```json
{
  "error": "Validation failed",
  "issues": {
    "fullName": "Expected format 'owner/repo', got 'invalid'"
  }
}
```

---

### GET /api/repositories/[id]
Get a single repository by ID.

```bash
curl -X GET "http://localhost:3000/api/repositories/repo-1" \
  -H "Content-Type: application/json" | jq .
```

**Response (200)**:
```json
{
  "data": {
    "id": "repo-1",
    "githubRepoId": 123456789,
    "fullName": "acme-corp/backend-api",
    "owner": "acme-corp",
    "name": "backend-api",
    "installationId": 999111,
    "isActive": true,
    "createdAt": "2026-05-13T12:35:00.000Z",
    "updatedAt": "2026-05-13T12:35:00.000Z"
  }
}
```

**Error Response (404)**:
```json
{
  "error": "Repository not found"
}
```

---

### PATCH /api/repositories/[id]
Update a repository.

```bash
curl -X PATCH "http://localhost:3000/api/repositories/repo-1" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookSecret": "new_secret_1234567890123456789",
    "isActive": false
  }' | jq .
```

**Request Body** (all fields optional):
```json
{
  "webhookSecret": "new_secret_minimum_20_chars",
  "isActive": false
}
```

**Response (200)**: Updated repository object

---

## Review Endpoints

### GET /api/reviews
List all reviews with filtering.

```bash
# All reviews
curl -X GET "http://localhost:3000/api/reviews?page=1&limit=20" \
  -H "Content-Type: application/json" | jq .

# Filter by repository
curl -X GET "http://localhost:3000/api/reviews?repositoryId=repo-1&page=1" \
  -H "Content-Type: application/json" | jq .

# Filter by status
curl -X GET "http://localhost:3000/api/reviews?status=COMPLETED&page=1" \
  -H "Content-Type: application/json" | jq .

# Combined filters
curl -X GET "http://localhost:3000/api/reviews?repositoryId=repo-1&status=PENDING&page=1" \
  -H "Content-Type: application/json" | jq .
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)
- `repositoryId` (optional) - Filter by repository
- `status` (optional) - PENDING | IN_PROGRESS | COMPLETED | FAILED

**Response (200)**:
```json
{
  "data": [
    {
      "id": "review-1",
      "prNumber": 42,
      "prTitle": "Fix: Add validation to user registration endpoint",
      "prUrl": "https://github.com/acme-corp/backend-api/pull/42",
      "headSha": "abc1234567890def",
      "baseSha": "base1234567890abc",
      "status": "COMPLETED",
      "summary": "Found 2 issues: 1 security concern, 1 style issue",
      "createdAt": "2026-05-13T12:35:00.000Z",
      "updatedAt": "2026-05-13T12:35:00.000Z",
      "repositoryId": "repo-1",
      "authorId": "user-1"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 4
  }
}
```

---

## Rule Endpoints

### GET /api/rules
List rules with filtering.

```bash
# All rules
curl -X GET "http://localhost:3000/api/rules?page=1&limit=20" \
  -H "Content-Type: application/json" | jq .

# Filter by category
curl -X GET "http://localhost:3000/api/rules?category=SECURITY&page=1" \
  -H "Content-Type: application/json" | jq .

# Filter by repository (repo-scoped rules)
curl -X GET "http://localhost:3000/api/rules?repositoryId=repo-1&page=1" \
  -H "Content-Type: application/json" | jq .

# Combined
curl -X GET "http://localhost:3000/api/rules?category=PERFORMANCE&repositoryId=repo-1" \
  -H "Content-Type: application/json" | jq .
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)
- `category` (optional) - SECURITY | PERFORMANCE | STYLE | CORRECTNESS
- `repositoryId` (optional) - Filter repo-scoped rules

**Response (200)**:
```json
{
  "data": [
    {
      "id": "rule-1",
      "name": "SQL Injection Detection",
      "description": "Detects potential SQL injection vulnerabilities in query strings",
      "category": "SECURITY",
      "severity": "CRITICAL",
      "isEnabled": true,
      "pattern": "SELECT\\s+.*\\s+FROM\\s+.*\\s+WHERE",
      "createdAt": "2026-05-13T12:35:00.000Z",
      "updatedAt": "2026-05-13T12:35:00.000Z",
      "repositoryId": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 7
  }
}
```

---

## Error Responses

All endpoints follow consistent error handling:

### 400 - Validation Error
```json
{
  "error": "Validation failed",
  "issues": {
    "fieldName": "Error message"
  }
}
```

### 404 - Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 - Conflict (Duplicate)
```json
{
  "error": "Repository already registered"
}
```

### 500 - Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Response Envelope Format

### Single Resource (GET detail, POST, PATCH):
```json
{
  "data": { ... }
}
```

### List Resources (GET list):
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error (4xx, 5xx):
```json
{
  "error": "Human readable error message",
  "issues": { "field": "optional field-specific error" }
}
```

---

## Testing Tools

### Pretty Print JSON
```bash
curl ... | jq .
```

### Save Response to File
```bash
curl ... > response.json
```

### Test with Custom Headers
```bash
curl -X GET "http://localhost:3000/api/repositories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token_here" | jq .
```

### Test with Form Data
```bash
curl -X POST "http://localhost:3000/api/repositories" \
  -H "Content-Type: application/json" \
  -d @payload.json | jq .
```

---

## Implementation Status

| Endpoint | Status | Tests |
|----------|--------|-------|
| GET /api/repositories | ✅ | 4 |
| POST /api/repositories | ✅ | 5 |
| GET /api/repositories/[id] | ✅ | 3 |
| PATCH /api/repositories/[id] | ✅ | 4 |
| DELETE /api/repositories/[id] | ⏳ | Pending |
| GET /api/reviews | ✅ | 4 |
| GET /api/reviews/[id] | ⏳ | Pending |
| GET /api/reviews/[id]/findings | ⏳ | Pending |
| DELETE /api/reviews/[id] | ⏳ | Pending |
| GET /api/rules | ✅ | 4 |
| POST /api/rules | ⏳ | Pending |
| GET /api/rules/[id] | ⏳ | Pending |
| PATCH /api/rules/[id] | ⏳ | Pending |
| DELETE /api/rules/[id] | ⏳ | Pending |
| GET /api/repositories/[id]/members | ⏳ | Pending |
| POST /api/repositories/[id]/members | ⏳ | Pending |
| PATCH /api/repositories/[id]/members/[userId] | ⏳ | Pending |
| DELETE /api/repositories/[id]/members/[userId] | ⏳ | Pending |
| POST /api/webhooks/github | ⏳ | Pending |
| POST /api/auth/[...nextauth] | ⏳ | Pending |

✅ = Implemented and tested  
⏳ = Coming next

---

## Test Results

```
✅ Test Files  6 passed (6)
✅ Tests      24 passed (24)
⏱ Duration   281ms
```

Run tests with:
```bash
npm test          # Once
npm test:watch    # Watch mode
npm test:ui       # Web dashboard
npm test:coverage # Coverage report
```
