# API Implementation Summary

## Testing Approach
All endpoints are implemented using **Test-Driven Development (TDD)**:
1. Write tests FIRST (test file)
2. Implement business logic (handler file)
3. Wire up Next.js route handler
4. Run tests to verify

## Test Results
✅ **All API tests passing (24 tests across 6 suites)**

```bash
npm test        # Run all tests
npm test:watch  # Watch mode
npm test:ui     # Web UI for test results
```

---

## Implemented Endpoints

### Repositories (5/5)

#### GET /api/repositories
- **Test**: `src/app/api/repositories/repositories.test.ts`
- **Handler**: `src/app/api/repositories/handler.ts`
- **Route**: `src/app/api/repositories/route.ts`
- **Tests**: ✅ 4 tests
  - List repositories with pagination
  - Handle pagination correctly
  - Database error handling
  - Default pagination values

**Query Parameters**:
```json
{
  "page": 1,
  "limit": 20
}
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "repo-1",
      "githubRepoId": 123,
      "fullName": "acme/backend",
      "owner": "acme",
      "name": "backend",
      "installationId": 999,
      "isActive": true,
      "createdAt": "2026-05-13T12:00:00Z",
      "updatedAt": "2026-05-13T12:00:00Z"
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

#### POST /api/repositories
- **Test**: `src/app/api/repositories/create.test.ts`
- **Handler**: `src/app/api/repositories/create-handler.ts`
- **Route**: `src/app/api/repositories/route.ts`
- **Tests**: ✅ 5 tests
  - Create new repository
  - Validate required fields
  - Validate fullName format (owner/repo)
  - Validate webhook secret length (≥20 chars)
  - Handle database errors

**Request Body** (201):
```json
{
  "githubRepoId": 999,
  "fullName": "owner/repo",
  "installationId": 123,
  "webhookSecret": "secret_minimum_20_characters_long"
}
```

**Error Response** (400):
```json
{
  "error": "Validation failed",
  "issues": {
    "fullName": "Invalid format. Use 'owner/repo'"
  }
}
```

---

#### GET /api/repositories/[id]
- **Test**: `src/app/api/repositories/[id]/get.test.ts`
- **Handler**: `src/app/api/repositories/[id]/get-handler.ts`
- **Route**: `src/app/api/repositories/[id]/route.ts`
- **Tests**: ✅ 3 tests
  - Fetch single repository
  - Handle 404 when not found
  - Database error handling

**Response** (200):
```json
{
  "data": {
    "id": "repo-1",
    "githubRepoId": 123,
    "fullName": "acme/backend",
    "owner": "acme",
    "name": "backend",
    "installationId": 999,
    "isActive": true,
    "createdAt": "2026-05-13T12:00:00Z",
    "updatedAt": "2026-05-13T12:00:00Z"
  }
}
```

**Error Response** (404):
```json
{
  "error": "Repository not found"
}
```

---

#### PATCH /api/repositories/[id]
- **Test**: `src/app/api/repositories/[id]/update.test.ts`
- **Handler**: `src/app/api/repositories/[id]/update-handler.ts`
- **Route**: `src/app/api/repositories/[id]/route.ts`
- **Tests**: ✅ 4 tests
  - Update webhook secret
  - Update active status
  - Input validation
  - Handle 404 on not found

**Request Body**:
```json
{
  "webhookSecret": "new_secret_minimum_20_chars",
  "isActive": false
}
```

---

#### DELETE /api/repositories/[id]
- **Status**: Not yet implemented (coming next)
- **Tests**: Pending

---

### Reviews (2/4)

#### GET /api/reviews
- **Test**: `src/app/api/reviews/reviews.test.ts`
- **Handler**: `src/app/api/reviews/handler.ts`
- **Route**: `src/app/api/reviews/route.ts`
- **Tests**: ✅ 4 tests
  - List reviews with pagination
  - Filter by repository
  - Filter by status
  - Handle combined filters

**Query Parameters**:
```json
{
  "page": 1,
  "limit": 20,
  "repositoryId": "repo-1",
  "status": "COMPLETED"
}
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "review-1",
      "prNumber": 42,
      "prTitle": "Fix: Add validation",
      "prUrl": "https://github.com/org/repo/pull/42",
      "headSha": "abc123",
      "baseSha": "def456",
      "status": "COMPLETED",
      "summary": "Found 2 issues",
      "createdAt": "2026-05-13T12:00:00Z",
      "updatedAt": "2026-05-13T12:00:00Z",
      "repositoryId": "repo-1",
      "authorId": "user-1"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 4 }
}
```

---

#### GET /api/reviews/[id]
- **Status**: Not yet implemented (coming next)
- **Tests**: Pending

#### GET /api/reviews/[id]/findings
- **Status**: Not yet implemented
- **Tests**: Pending

#### DELETE /api/reviews/[id]
- **Status**: Not yet implemented
- **Tests**: Pending

---

### Rules (1/5)

#### GET /api/rules
- **Test**: `src/app/api/rules/rules.test.ts`
- **Handler**: `src/app/api/rules/handler.ts`
- **Route**: `src/app/api/rules/route.ts`
- **Tests**: ✅ 4 tests
  - List rules with pagination
  - Filter by category (SECURITY, PERFORMANCE, STYLE, CORRECTNESS)
  - Filter by repository
  - Handle combined filters

**Query Parameters**:
```json
{
  "page": 1,
  "limit": 20,
  "category": "SECURITY",
  "repositoryId": "repo-1"
}
```

---

#### POST /api/rules
- **Status**: Not yet implemented
- **Tests**: Pending

#### GET /api/rules/[id]
- **Status**: Not yet implemented
- **Tests**: Pending

#### PATCH /api/rules/[id]
- **Status**: Not yet implemented
- **Tests**: Pending

#### DELETE /api/rules/[id]
- **Status**: Not yet implemented
- **Tests**: Pending

---

### Team Members (0/4)
- Not yet implemented

---

### Webhooks (0/1)
- **POST /api/webhooks/github** — Not yet implemented

---

### Auth (0/1)
- **GET/POST /api/auth/[...nextauth]** — Not yet implemented

---

## Project Structure

```
src/
├── app/
│   └── api/
│       ├── repositories/
│       │   ├── route.ts                    # GET, POST
│       │   ├── handler.ts                  # getRepositories()
│       │   ├── create-handler.ts           # createRepository()
│       │   ├── repositories.test.ts        # ✅ 4 tests
│       │   ├── create.test.ts              # ✅ 5 tests
│       │   └── [id]/
│       │       ├── route.ts                # GET, PATCH
│       │       ├── get-handler.ts          # getRepositoryById()
│       │       ├── get.test.ts             # ✅ 3 tests
│       │       ├── update-handler.ts       # updateRepository()
│       │       └── update.test.ts          # ✅ 4 tests
│       ├── reviews/
│       │   ├── route.ts                    # GET
│       │   ├── handler.ts                  # getReviews()
│       │   └── reviews.test.ts             # ✅ 4 tests
│       └── rules/
│           ├── route.ts                    # GET
│           ├── handler.ts                  # getRules()
│           └── rules.test.ts               # ✅ 4 tests
├── lib/
│   ├── env.ts                              # Environment validation (Zod)
│   ├── db.ts                               # Prisma client singleton
│   └── validate.ts                         # Validation helper
└── types/
    └── schemas/
        ├── common.ts                       # Pagination, response envelopes
        ├── repository.ts                   # Repository Zod schemas
        ├── review.ts                       # Review, Finding, Status enums
        ├── rule.ts                         # Rule Zod schemas
        └── team.ts                         # TeamMember Zod schemas

vitest.config.ts                            # Test configuration
tsconfig.json                               # TypeScript configuration
```

---

## Validation & Error Handling

### Input Validation (Zod)
All request bodies are validated using Zod schemas:
- ✅ Type safety with TypeScript
- ✅ Runtime validation at API boundary
- ✅ Descriptive error messages

### Error Responses

| Status | Scenario |
|--------|----------|
| **400** | Invalid input validation (Zod) |
| **401** | Webhook signature invalid (pending) |
| **404** | Resource not found |
| **409** | Conflict (e.g., duplicate repo) |
| **422** | Malformed JSON body |
| **500** | Internal server error |

### Response Format

**Success (200/201)**:
```json
{
  "data": {...} or [{...}],
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Human-readable error message",
  "issues": { "field": "Field-specific error" }
}
```

---

## Next Steps (Implementation Priority)

1. **DELETE endpoints** for repositories and reviews
2. **POST /api/rules** — Create rules
3. **PATCH /api/rules/[id]** — Update rule severity/enabled
4. **GET /api/repositories/[id]/members** — List team members
5. **POST /api/repositories/[id]/members** — Invite team members
6. **Webhook handler** — POST /api/webhooks/github with HMAC verification
7. **GitHub OAuth** — NextAuth setup
8. **Row-level authorization** — Add ownership checks to queries

---

## Testing Commands

```bash
# Run all tests once
npm test

# Watch mode for development
npm test:watch

# View tests in web UI
npm test:ui

# Test coverage report
npm test:coverage
```

---

## TDD Workflow Template

For each new endpoint:

1. **Create test file** → `src/app/api/[resource]/[action].test.ts`
   ```typescript
   import { describe, it, expect, beforeEach, vi } from 'vitest';
   import { prisma } from '@/lib/db';
   import { myHandler } from './handler';
   
   vi.mock('@/lib/db', () => ({
     prisma: { resource: { method: vi.fn() } }
   }));
   
   describe('ENDPOINT', () => {
     it('should...', async () => {
       // Arrange
       // Act
       // Assert
     });
   });
   ```

2. **Create handler** → `src/app/api/[resource]/[action]-handler.ts`
   - Pure business logic
   - Input validation with Zod
   - Returns success/error interface

3. **Create route** → `src/app/api/[resource]/route.ts`
   - Next.js route handler
   - Extract query/body
   - Call handler
   - Return NextResponse

4. **Run tests** → `npm test`

---

## Integration With Database

All endpoints use **Prisma ORM** for database access:
- ✅ Type-safe queries
- ✅ SQL injection prevention
- ✅ Migration management
- ✅ Real data from PostgreSQL

Database schema defined in `prisma/schema.prisma` with all 6 models.
