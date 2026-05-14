# CodeReview Bot

AI-powered pull request review assistant that automatically analyzes GitHub PRs for security vulnerabilities, performance issues, and code style violations — before they reach main.

## Features

- **Automated PR analysis** — security, performance, and style findings generated per pull request
- **GitHub webhook ingestion** — triggered on PR open/synchronize events
- **Web dashboard** — browse reviews, findings, and repository configurations
- **Team management** — role-based access (Admin / Member / Viewer) per repository
- **Rule engine** — configurable global and per-repository analysis rules
- **GitHub MCP integration** — live repository metadata and PR details via Model Context Protocol

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A GitHub OAuth App (for authentication)
- A GitHub App (for webhook events and API access)

### 1. Clone and install

```bash
git clone <repo-url>
cd my-capstone
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in every value:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/codereview_bot

# NextAuth (GitHub OAuth)
GITHUB_APP_CLIENT_ID=Ov23li...
GITHUB_APP_CLIENT_SECRET=<secret>
NEXTAUTH_SECRET=<random 32+ char string>
NEXTAUTH_URL=http://localhost:3000

# GitHub App (for webhook verification and API calls)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_WEBHOOK_SECRET=<random string used when creating the webhook>

# GitHub MCP integration
GITHUB_TOKEN=ghp_...

# AI analysis
ANTHROPIC_API_KEY=sk-ant-...
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

Optionally seed with sample data:
```bash
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with GitHub.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   GitHub                        │
│  Webhook events ──────────────────────────────► │
│  OAuth login ─────────────────────────────────► │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Next.js 15 App                     │
│                                                 │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │  Web Dashboard  │  │    API Routes        │  │
│  │  (React/TSX)    │  │  /api/repositories   │  │
│  │                 │  │  /api/reviews        │  │
│  │  Dashboard      │  │  /api/rules          │  │
│  │  Repositories   │  │  /api/webhooks/github│  │
│  │  Reviews        │  │  /api/auth/*         │  │
│  │  Rules          │  └──────────┬───────────┘  │
│  │  Team           │             │              │
│  └─────────────────┘             │              │
│                                  ▼              │
│                    ┌─────────────────────────┐  │
│                    │  Analysis Engine        │  │
│                    │  Security Scanner       │  │
│                    │  Performance Analyzer   │  │
│                    │  Style Checker          │  │
│                    └────────────┬────────────┘  │
│                                 │               │
│                    ┌────────────▼────────────┐  │
│                    │  MCP Integration        │  │
│                    │  GitHub MCP Server      │  │
│                    └────────────┬────────────┘  │
└─────────────────────────────────┼───────────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │  PostgreSQL (Prisma ORM)  │
                    │  Repository              │
                    │  Review                  │
                    │  Finding                 │
                    │  Rule                    │
                    │  User                    │
                    │  TeamMember              │
                    └──────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (GitHub OAuth) |
| Validation | Zod |
| Data fetching | SWR |
| MCP | `@modelcontextprotocol/sdk` |
| Testing | Vitest, React Testing Library |
| CI/CD | GitHub Actions |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # GitHub OAuth login page
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── page.tsx           # Overview
│   │   ├── repositories/      # Repository management
│   │   ├── reviews/           # Review browsing
│   │   ├── rules/             # Rule configuration
│   │   └── team/              # Team management
│   └── api/
│       ├── auth/              # NextAuth handlers
│       ├── repositories/      # Repository CRUD + GitHub integration
│       ├── reviews/           # Review listing
│       ├── rules/             # Rule CRUD
│       └── webhooks/          # GitHub webhook ingestion
├── components/
│   ├── ui/                    # Base components (Button, Card, Table…)
│   ├── layout/                # Sidebar, NavLink, UserMenu
│   ├── repositories/          # Repository-specific components
│   ├── reviews/               # Review and finding components
│   ├── rules/                 # Rule management components
│   └── team/                  # Team member components
├── hooks/                     # SWR data hooks
├── lib/                       # Utilities (db, auth, env, mcp client)
├── middleware.ts              # Auth protection + route guard
└── types/                     # TypeScript types + Zod schemas
prisma/
├── schema.prisma              # Database schema
└── migrations/                # Migration history
.github/workflows/
└── ci.yml                     # CI: lint, typecheck, test, build, audit
.claude/commands/
├── deploy-check.md            # Pre-deployment checklist
├── security-scan.md           # Security audit command
└── add-feature.md             # Feature scaffolding guide
docs/
├── SPEC.md                    # Project specification
├── API.md                     # API endpoint reference
├── SECURITY-AUDIT.md          # Security audit report
└── ...                        # Architecture docs
```

---

## Development

### Run tests

```bash
npm test                   # run once
npm run test:watch         # watch mode
npm run test:coverage      # with coverage report
```

### Lint and type-check

```bash
npm run lint
npx tsc --noEmit
```

### Database operations

```bash
npx prisma migrate dev     # create and apply a new migration
npx prisma migrate deploy  # apply migrations (production)
npx prisma studio          # open database GUI at :5555
npx prisma generate        # regenerate Prisma client
```

### GitHub MCP integration

Set `GITHUB_TOKEN` in `.env.local`. The MCP server is spawned automatically when the `github-info` or `pull-requests` endpoints are called.

---

## API Reference

See [docs/API.md](docs/API.md) for full endpoint documentation with request and response examples.

---

## Security

See [docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md) for the latest security audit report.

Key protections in place:
- All API routes require a valid NextAuth session
- Repository-scoped endpoints verify owner or team membership
- Pagination is capped at 100 records per request
- HTTP security headers (CSP, X-Frame-Options, HSTS) via `next.config.ts`
- Environment variables validated at startup via Zod schema

---

## CI/CD

GitHub Actions runs on every PR to `main` and on push to `main`:

1. **Test** — lint, type-check, unit tests with coverage (requires PostgreSQL service)
2. **Build** — production Next.js build
3. **Security** — `npm audit` at HIGH severity

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make changes following the conventions in [CLAUDE.md](CLAUDE.md)
4. Run `npm test` and `npm run lint`
5. Open a pull request

---

## License

ISC
