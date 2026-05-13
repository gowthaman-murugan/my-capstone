# CLAUDE.md

## Project Name

**CodeReview Bot — AI-Powered PR Review Assistant**

---

# Project Description

CodeReview Bot is an AI-powered pull request review platform that integrates with GitHub repositories through webhook events.  
The system automatically analyzes pull requests for:

- Security vulnerabilities
- Performance issues
- Code style and convention violations

The goal is to provide developers with fast, actionable, and low-noise feedback before code is merged.

The platform includes:

- GitHub webhook ingestion
- Automated analysis engine
- Web dashboard for review management
- Team and repository configuration
- Rule management and severity customization
- Historical review tracking

This project is inspired by modern automated review systems such as:
- GitHub Actions
- Anthropic Claude Code Action workflows
- AI-assisted static analysis pipelines

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | NextAuth/Auth.js (planned) |
| Background Jobs | Queue-based async processing |
| AI/Analysis | Internal rule engine + MCP integrations |
| CI/CD | GitHub Actions |
| Testing | Vitest, React Testing Library, Playwright |

---

# Architecture Overview

```text
├── Webhook Handler
│   └── POST /api/webhooks/github
│
├── Analysis Engine
│   ├── Security Scanner
│   ├── Performance Analyzer
│   └── Style Checker
│
├── Web UI
│   ├── Dashboard
│   ├── Review Details
│   ├── Repository Settings
│   └── Team Management
│
├── Database
│   ├── Repository
│   ├── Review
│   ├── Finding
│   ├── Rule
│   └── User
│
├── MCP Integration
│   └── GitHub MCP
│
└── CI/CD
    └── GitHub Actions
```

---

# Coding Conventions

## TypeScript Rules

- Strict mode enabled
- Avoid `any`
- Prefer explicit types for public APIs
- Use Zod for request validation
- Shared DTOs must live in `types/`

---

# Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `ReviewCard.tsx` |
| Hooks | camelCase with `use` | `useReviewFilters.ts` |
| Utility files | camelCase | `formatDate.ts` |
| Route folders | kebab-case | `review-history/` |
| Prisma models | PascalCase | `Finding` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

# Testing Strategy

## Unit Tests

Tools:
- Vitest
- React Testing Library

Coverage:
- Utility functions
- Analysis rules
- React components
- API handlers

---

## Integration Tests

Test:
- Prisma interactions
- API workflows
- Webhook processing
- Queue execution
- MCP integrations

---

## End-to-End Tests

Tool:
- Playwright

Critical flows:
- GitHub webhook ingestion
- Review creation
- Dashboard rendering
- Rule configuration
- Team management

---

# Scope Boundaries

## This Project Includes

- GitHub PR webhook ingestion
- Automated PR analysis
- Security/performance/style findings
- Review dashboard
- Team management
- Rule configuration
- Historical review tracking

---

## This Project Does NOT Include

- Full IDE/editor integrations
- Real-time collaborative editing
- Self-hosted Git providers beyond GitHub
- Automatic code fixing/commits
- Full static application security testing platform
- Runtime production monitoring
- Dependency vulnerability management
- CI runner orchestration
- AI model training infrastructure
- Source code hosting
- Enterprise compliance tooling
