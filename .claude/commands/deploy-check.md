# Pre-Deployment Verification Checklist

Run this command before every deployment to verify the project is production-ready.

## Steps

### 1. Environment Variables
Check that all required environment variables are set in the target environment:
```
DATABASE_URL
NEXTAUTH_SECRET (min 32 chars)
NEXTAUTH_URL
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
GITHUB_APP_CLIENT_ID
GITHUB_APP_CLIENT_SECRET
GITHUB_WEBHOOK_SECRET
ANTHROPIC_API_KEY
```

### 2. Dependencies
```bash
npm audit --audit-level=high
npm outdated
```
Fail the deployment if any HIGH or CRITICAL vulnerabilities are found.

### 3. Type Check
```bash
npx tsc --noEmit
```
Must pass with zero errors.

### 4. Lint
```bash
npm run lint
```
Must pass with zero errors (warnings acceptable).

### 5. Tests
```bash
npm run test:coverage
```
All tests must pass. Coverage must not regress from baseline.

### 6. Production Build
```bash
npm run build
```
Must complete without errors or warnings about missing env vars.

### 7. Database Migrations
```bash
npx prisma migrate status
```
Verify no pending migrations. If migrations exist, apply them:
```bash
npx prisma migrate deploy
```

### 8. Prisma Client
```bash
npx prisma generate
```
Ensure the generated client matches the current schema.

### 9. Security Headers Verification
After deploying to staging, run:
```bash
curl -I https://<staging-url>/
```
Confirm these headers are present:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### 10. Health Checks
- `GET /api/auth/providers` → should return list of providers (no 500)
- `GET /api/repositories` with a valid session → should return `{ data: [], meta: {...} }`

## Checklist Summary

- [ ] All env vars configured
- [ ] `npm audit` passes at HIGH level
- [ ] `tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0
- [ ] All tests pass
- [ ] `npm run build` exits 0
- [ ] No pending DB migrations
- [ ] Security headers verified on staging
- [ ] Health check endpoints respond correctly
