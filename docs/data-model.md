# Data Model

## Prisma Schema: `prisma/schema.prisma`

### Enums

```prisma
enum ReviewStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum Severity {
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum FindingCategory {
  SECURITY
  PERFORMANCE
  STYLE
  CORRECTNESS
}

enum TeamRole {
  ADMIN
  MEMBER
  VIEWER
}
```

### Models

```prisma
model User {
  id           String       @id @default(cuid())
  githubId     String       @unique
  email        String       @unique
  name         String?
  avatarUrl    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  repositories Repository[]
  reviews      Review[]
  memberships  TeamMember[]
}

model Repository {
  id             String       @id @default(cuid())
  githubRepoId   Int          @unique
  fullName       String       @unique    // "owner/repo"
  owner          String
  name           String
  installationId Int
  webhookSecret  String                  // per-repo HMAC secret
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  ownerId        String
  ownerUser      User         @relation(fields: [ownerId], references: [id])
  reviews        Review[]
  rules          Rule[]
  members        TeamMember[]
}

model Review {
  id           String       @id @default(cuid())
  prNumber     Int
  prTitle      String
  prUrl        String
  headSha      String
  baseSha      String
  status       ReviewStatus @default(PENDING)
  summary      String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  repositoryId String
  repository   Repository   @relation(fields: [repositoryId], references: [id])
  authorId     String?
  author       User?        @relation(fields: [authorId], references: [id])
  findings     Finding[]

  @@unique([repositoryId, prNumber, headSha])  // idempotency key
}

model Finding {
  id        String          @id @default(cuid())
  filePath  String
  lineStart Int
  lineEnd   Int?
  severity  Severity
  category  FindingCategory
  message   String
  suggestion String?
  createdAt DateTime        @default(now())
  ruleId    String?
  rule      Rule?           @relation(fields: [ruleId], references: [id])
  reviewId  String
  review    Review          @relation(fields: [reviewId], references: [id], onDelete: Cascade)
}

model Rule {
  id           String          @id @default(cuid())
  name         String
  description  String?
  category     FindingCategory
  severity     Severity        @default(WARNING)
  isEnabled    Boolean         @default(true)
  pattern      String?         // regex or rule DSL
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  repositoryId String?         // null = global rule; non-null = repo-scoped override
  repository   Repository?     @relation(fields: [repositoryId], references: [id])
  findings     Finding[]
}

model TeamMember {
  id           String     @id @default(cuid())
  role         TeamRole   @default(MEMBER)
  createdAt    DateTime   @default(now())
  userId       String
  user         User       @relation(fields: [userId], references: [id])
  repositoryId String
  repository   Repository @relation(fields: [repositoryId], references: [id])

  @@unique([userId, repositoryId])
}
```

---

## Relationships

```
User ──────1:N──── Repository (owner)
User ──────1:N──── Review     (PR author)
User ──────1:N──── TeamMember

Repository ─1:N─── Review
Repository ─1:N─── Rule      (repo-scoped, repositoryId set)
Repository ─1:N─── TeamMember

Review ────1:N──── Finding

Rule ───────1:N─── Finding   (optional linkback — null for ad-hoc findings)

Rule (global): repositoryId = null   → applies to all repos
Rule (scoped): repositoryId = X      → overrides global for repo X
```

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| `@@unique([repositoryId, prNumber, headSha])` on Review | Prevents duplicate job enqueues when GitHub retries a webhook |
| `webhookSecret` per-repository (not global) | Multi-tenant — each repo has its own secret registered in GitHub |
| `Finding.onDelete: Cascade` from Review | Deleting a Review removes all its Findings automatically |
| `Rule.repositoryId = null` = global | Allows default rule set with per-repo overrides without duplication |
| No raw `id Int @autoincrement()` | `cuid()` strings are safe to expose in URLs without enumeration risk |

---

## Migrations

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Apply in production
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

## Verification

After running `prisma migrate dev`, `prisma studio` should show all 6 tables with correct columns and foreign keys.
