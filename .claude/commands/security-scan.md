# Security Scan

Run a comprehensive security audit of the CodeReview Bot codebase and generate a findings report.

## What to Check

### 1. Dependency Vulnerabilities
```bash
npm audit --json > /tmp/npm-audit.json
npm audit --audit-level=moderate
```
Report HIGH and CRITICAL findings with CVE numbers and fix commands.

### 2. Input Validation Coverage
Review every API route handler in `src/app/api/` and verify:
- All `POST`/`PATCH` request bodies are parsed through a Zod schema
- All path parameters (`[id]`, `[userId]`, `[prNumber]`) are validated before DB use
- Pagination `limit` is capped (should be ≤ 100 in `src/types/schemas/common.ts`)
- Enum inputs (status, category, role) are validated against the allowed set

### 3. Authentication & Authorization Gaps
For every route in `src/app/api/`:
- Confirm `requireAuth()` is called before any data access
- Confirm mutation endpoints (`POST`, `PATCH`, `DELETE`) check ownership or admin role
- Confirm repository-scoped endpoints verify the user is owner or team member
- Check the webhook route (`/api/webhooks/*`) has HMAC signature validation

### 4. Injection Vulnerabilities
- Grep for raw string concatenation in Prisma queries (should use parameterized args)
- Check for any `eval()`, `new Function()`, or `child_process.exec()` with user input
- Check for unescaped output in server-rendered pages (React escapes by default, but watch for `dangerouslySetInnerHTML`)

```bash
grep -r "dangerouslySetInnerHTML" src/
grep -r "eval(" src/
grep -r "exec(" src/lib/ src/app/api/
```

### 5. Secrets & Hardcoded Credentials
```bash
grep -r "sk-ant-" src/ --include="*.ts"
grep -r "ghp_" src/ --include="*.ts"
grep -r "postgresql://" src/ --include="*.ts"
grep -rn "password\|secret\|token\|key" src/ --include="*.ts" | grep -v "process.env\|schema\|test\|mock"
```
Any hits outside of `src/lib/env.ts` or test fixtures should be flagged.

### 6. HTTP Security Headers
After starting the dev server (`npm run dev`), check:
```bash
curl -sI http://localhost:3000 | grep -E "X-Frame|X-Content-Type|Strict-Transport|Content-Security"
```
All four headers should be present.

### 7. CORS Configuration
Verify that `/api/*` routes do not set `Access-Control-Allow-Origin: *`. Check `next.config.ts` and any middleware CORS handlers.

### 8. Rate Limiting
Confirm rate limiting exists on:
- `POST /api/repositories` (repository creation)
- Any endpoint that writes to the DB

If no rate limiting is present, flag it as MEDIUM severity.

## Output Format

Generate or update `docs/SECURITY-AUDIT.md` with:

```
| Severity | File | Line | Finding | Status |
|----------|------|------|---------|--------|
| HIGH     | src/... | 42 | Description | Open/Fixed |
```

Apply fixes for all HIGH findings immediately. For MEDIUM and LOW findings, document the recommended remediation.
