# Security Considerations

---

## Authentication — NextAuth/Auth.js v5

### Setup: `src/app/api/auth/[...nextauth]/route.ts`

```ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, profile }) {
      if (profile) token.githubId = String(profile.id);
      return token;
    },
    session({ session, token }) {
      session.user.githubId = token.githubId as string;
      return session;
    },
  },
});
```

### Middleware: `src/middleware.ts`

Protect all routes except public ones:

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isPublic =
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname === "/api/webhooks/github" ||
    req.nextUrl.pathname === "/login";

  if (!isPublic && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
```

---

## Webhook Security

### HMAC-SHA256 Verification: `src/app/api/webhooks/github/route.ts`

```ts
import { createHmac, timingSafeEqual } from "crypto";

export async function POST(req: Request) {
  const rawBody = await req.text();           // must be text(), not json()
  const signature = req.headers.get("x-hub-signature-256");

  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  // Look up the repo's webhookSecret by x-github-hook-installation-target-id
  const secret = await getWebhookSecretForInstallation(req.headers);

  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expBuffer.length ||
    !timingSafeEqual(sigBuffer, expBuffer)  // no timing attack
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse only after auth
  const payload = JSON.parse(rawBody);
  // ...
}
```

### Rules

| Rule | Why |
|------|-----|
| Always `timingSafeEqual` | String equality (`===`) leaks timing info — attackers can brute-force secret one byte at a time |
| Read body as `text()` | Signature is computed over raw bytes; `req.json()` normalizes whitespace |
| Per-repository `webhookSecret` | Multi-tenant — one compromised secret doesn't affect other repos |
| Return `200` for unhandled events | GitHub retries on non-2xx, causing duplicate events |
| Reject payloads > 25MB | Prevent memory exhaustion from oversized webhook bodies |

---

## Input Validation

### Zod on All Inputs

Every API route handler validates with Zod before any DB access:

```ts
// Route handler pattern
export async function POST(req: Request) {
  const body = await req.json();
  const validation = validateBody(CreateRuleSchema, body);
  if (!validation.success) return validation.response;  // 422

  // validation.data is now fully typed and safe
  await prisma.rule.create({ data: validation.data });
}
```

### Query Parameter Validation

```ts
const url = new URL(req.url);
const validation = validateQuery(ReviewListQuerySchema, url.searchParams);
if (!validation.success) return validation.response;
```

### What Zod Protects Against

- Type coercion attacks (sending string where number expected)
- Unexpected extra fields leaking into DB writes (use `.strip()` or explicit shape)
- Missing required fields caught at the boundary, not deep in business logic

---

## Authorization (Row-Level)

### Ownership Check Pattern

Every DB read filters by the authenticated user's scope:

```ts
// CORRECT — tenant-scoped query
const repo = await prisma.repository.findFirst({
  where: { id: params.id, ownerId: session.user.id },  // ownerId filter
});
if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

Never query by `id` alone — always add the ownership/membership filter.

### Role-Based Checks for Team Mutations

```ts
const membership = await prisma.teamMember.findUnique({
  where: { userId_repositoryId: { userId: session.user.id, repositoryId: params.id } },
});

if (!membership || membership.role !== "ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## SQL Injection

Not applicable — Prisma parameterizes all queries. Never use `prisma.$queryRaw` with string interpolation. If raw SQL is needed, use tagged template literals:

```ts
// SAFE
prisma.$queryRaw`SELECT * FROM "Review" WHERE id = ${id}`;

// NEVER DO THIS
prisma.$queryRawUnsafe(`SELECT * FROM "Review" WHERE id = '${id}'`);
```

---

## XSS

React escapes all string values rendered in JSX by default. Rules:
- Never use `dangerouslySetInnerHTML` with user-supplied content
- Markdown rendering (review summaries): use a sanitizing library like `DOMPurify` before passing to any HTML renderer

---

## CORS

Next.js API routes are same-origin by default — no additional CORS config needed.

The webhook endpoint is server-to-server (GitHub → our server). CORS headers do not apply to server-to-server POST requests.

If a public API is ever added: restrict `Access-Control-Allow-Origin` to an explicit allowlist, never `*` for credentialed requests.

---

## Environment Variables

### Validation at Startup: `src/lib/env.ts`

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GITHUB_WEBHOOK_SECRET: z.string().min(20),
  GITHUB_APP_ID: z.string(),
  GITHUB_APP_PRIVATE_KEY: z.string().startsWith("-----BEGIN"),
  NEXTAUTH_SECRET: z.string().min(32),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
});

export const env = envSchema.parse(process.env);
```

This fails at startup (not at runtime) if any required env var is missing or malformed.

### Rules

- All secrets in `.env.local` — never committed (`.gitignore` entry required)
- `.env.example` committed with placeholder values and comments
- `GITHUB_APP_PRIVATE_KEY` stored as multiline PEM in env var (not file path)

---

## Dependency Security

- `npm audit` runs in CI on every push; fails build on high/critical vulnerabilities
- Dependabot configured in `.github/dependabot.yml` for weekly npm updates
- Lock file (`package-lock.json`) committed and verified in CI
