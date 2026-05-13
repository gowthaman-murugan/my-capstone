# Frontend Components

## Route Structure: `src/app/`

```
app/
  (auth)/
    login/
      page.tsx              // GitHub OAuth sign-in page
  (dashboard)/
    layout.tsx              // Sidebar nav + auth guard
    page.tsx                // Root → redirect to /reviews
    reviews/
      page.tsx              // ReviewListPage
      [id]/
        page.tsx            // ReviewDetailPage
    repositories/
      page.tsx              // RepositoryListPage
      [id]/
        page.tsx            // RepositoryDetailPage
        settings/
          page.tsx          // RepositorySettingsPage
    rules/
      page.tsx              // RuleListPage
    team/
      page.tsx              // TeamManagementPage
```

---

## Component Tree

### Layout

```
DashboardLayout (src/app/(dashboard)/layout.tsx)
  └── Sidebar
        ├── Logo
        ├── NavLink × 4  (Reviews, Repositories, Rules, Team)
        └── UserMenu
              ├── UserAvatar
              └── SignOutButton
```

### ReviewListPage

```
ReviewListPage
  ├── PageHeader ("Reviews")
  ├── ReviewFilters
  │     ├── StatusSelect    (All | Pending | In Progress | Completed | Failed)
  │     ├── RepositorySelect
  │     └── DateRangePicker
  ├── ReviewTable
  │     └── ReviewRow × N
  │           ├── StatusBadge
  │           ├── PRTitle (link → prUrl)
  │           ├── RepositoryName
  │           ├── FindingsCount (with severity breakdown)
  │           └── CreatedAt
  ├── EmptyState (when no reviews)
  └── Pagination
```

Props for `ReviewRow`:
```ts
interface ReviewRowProps {
  id: string
  prNumber: number
  prTitle: string
  prUrl: string
  status: ReviewStatus
  repository: { id: string; fullName: string }
  _count: { findings: number }
  createdAt: string
}
```

### ReviewDetailPage

```
ReviewDetailPage
  ├── ReviewHeader
  │     ├── PRTitle + PRLink (external)
  │     ├── StatusBadge
  │     └── ReviewSummary (markdown prose)
  ├── ReviewMeta
  │     ├── Repository (link)
  │     ├── Author (GitHub login)
  │     ├── Head SHA (truncated)
  │     └── Timestamps
  ├── FindingFilters
  │     ├── SeveritySelect
  │     ├── CategorySelect
  │     └── FilePathSearch
  ├── FindingsList
  │     └── FindingCard × N
  │           ├── SeverityBadge   (color-coded)
  │           ├── CategoryBadge
  │           ├── FileLocation    ("src/foo.ts:42")
  │           ├── Message
  │           └── Suggestion (collapsible)
  └── EmptyState (when no findings)
```

Props for `FindingCard`:
```ts
interface FindingCardProps {
  id: string
  filePath: string
  lineStart: number
  lineEnd?: number
  severity: Severity
  category: FindingCategory
  message: string
  suggestion?: string
  rule?: { id: string; name: string }
}
```

### RepositoryListPage

```
RepositoryListPage
  ├── PageHeader + AddRepositoryButton
  ├── AddRepositoryModal (controlled)
  │     ├── Input: GitHub repo (fullName "owner/repo")
  │     ├── Input: Webhook secret
  │     └── Submit
  ├── RepositoryTable
  │     └── RepositoryRow × N
  │           ├── RepoName (link → detail page)
  │           ├── ActiveBadge
  │           ├── LastReviewDate
  │           └── ActionsMenu (settings, delete)
  └── EmptyState
```

### RepositorySettingsPage

```
RepositorySettingsPage
  ├── WebhookConfigCard
  │     ├── WebhookSecretInput (masked, reveal toggle)
  │     └── ActiveToggle
  └── RuleOverridesTable
        └── RuleOverrideRow × N
              ├── RuleName
              ├── SeveritySelect (override)
              └── EnabledToggle
```

### RuleListPage

```
RuleListPage
  ├── PageHeader + CreateRuleButton
  ├── CreateRuleModal (controlled)
  │     ├── Input: name
  │     ├── Textarea: description
  │     ├── Select: category
  │     ├── Select: severity
  │     ├── Input: pattern (regex/DSL)
  │     ├── Select: repository (optional, for scoped rule)
  │     └── Submit
  ├── RulesTable
  │     └── RuleRow × N
  │           ├── RuleName
  │           ├── CategoryBadge
  │           ├── SeverityBadge
  │           ├── Scope ("Global" | repo name)
  │           ├── EnabledToggle
  │           └── ActionsMenu (edit, delete)
  └── EmptyState
```

### TeamManagementPage

```
TeamManagementPage
  ├── PageHeader + InviteMemberButton
  ├── InviteMemberModal (controlled)
  │     ├── Input: GitHub login
  │     ├── Select: role (Admin | Member | Viewer)
  │     └── Submit
  ├── MembersTable
  │     └── MemberRow × N
  │           ├── UserAvatar
  │           ├── UserName
  │           ├── RoleSelect (inline edit — ADMIN only)
  │           └── RemoveButton (ADMIN only)
  └── EmptyState
```

---

## Shared UI Components: `src/components/ui/`

| Component | Purpose |
|-----------|---------|
| `Button` | Primary, secondary, destructive variants |
| `Badge` | Severity and status color-coded labels |
| `Card` | Content container with padding |
| `Modal` | Dialog overlay with backdrop |
| `Table` | Responsive table with header/body/row |
| `Pagination` | Page controls with total count |
| `Select` | Styled `<select>` with label |
| `Input` | Styled `<input>` with label + error |
| `Textarea` | Styled `<textarea>` with label + error |
| `Spinner` | Loading indicator |
| `EmptyState` | Centered icon + message for empty lists |
| `ErrorBoundary` | Catches render errors, shows fallback |
| `Avatar` | Circular image with initials fallback |

---

## Custom Hooks: `src/hooks/`

| Hook | Purpose |
|------|---------|
| `useReviewFilters.ts` | Filter state + URL search param sync |
| `useReviews.ts` | Fetch review list with SWR + filters |
| `useReview.ts` | Fetch single review + findings |
| `useRepositories.ts` | Fetch repository list |
| `useRules.ts` | Fetch rule list with mutation helpers |
| `useTeamMembers.ts` | Fetch + mutate team members |

---

## Naming Conventions

Per `CLAUDE.md`:

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ReviewCard.tsx` |
| Hooks | camelCase + `use` prefix | `useReviewFilters.ts` |
| Route folders | kebab-case | `review-history/` |
| Utility files | camelCase | `formatDate.ts` |

---

## Verification

Run `npm run dev`, then navigate to:
- `/login` — GitHub OAuth sign-in renders
- `/reviews` — empty state renders without errors
- `/repositories` — add modal opens/closes
- `/rules` — create modal opens/closes
- `/team` — invite modal opens/closes

Check browser console for zero TypeScript/React errors.
