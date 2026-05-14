# Add Feature

Scaffold a complete new feature following the CodeReview Bot architecture.
Replace `{FEATURE}` with the feature name (kebab-case, e.g. `audit-log`).
Replace `{Model}` with the Prisma model name (PascalCase, e.g. `AuditLog`).

## Step 1 — Database Model

Add the model to `prisma/schema.prisma`:

```prisma
model {Model} {
  id          String   @id @default(cuid())
  // ... fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run:
```bash
npx prisma migrate dev --name add_{feature}
npx prisma generate
```

## Step 2 — TypeScript Types

Create `src/types/schemas/{feature}.ts`:
```ts
import { z } from 'zod';

export const {feature}CreateSchema = z.object({
  // required fields
});

export const {feature}UpdateSchema = z.object({
  // optional patch fields
}).partial();

export const {feature}ResponseSchema = z.object({
  id: z.string(),
  // response fields
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type {Model}Create = z.infer<typeof {feature}CreateSchema>;
export type {Model}Update = z.infer<typeof {feature}UpdateSchema>;
export type {Model}Response = z.infer<typeof {feature}ResponseSchema>;
```

Add types to `src/types/index.ts`.

## Step 3 — API Route Handlers

Create `src/app/api/{feature}s/`:

**`handler.ts`** — list/read business logic (no HTTP concerns):
```ts
import { prisma } from '@/lib/db';

export async function get{Model}s(query: Record<string, unknown>) {
  // validate, query, return
}
```

**`create-handler.ts`** — create business logic:
```ts
import { {feature}CreateSchema } from '@/types/schemas/{feature}';

export async function create{Model}(input: unknown, userId: string) {
  // validate with Zod, create with Prisma
}
```

**`route.ts`** — HTTP layer:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  // delegate to handler
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json();
  // delegate to create-handler
}
```

## Step 4 — React Hook

Create `src/hooks/use{Model}s.ts`:
```ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export function use{Model}s() {
  const { data, error, isLoading, mutate } = useSWR('/api/{feature}s', fetcher);
  return {
    {feature}s: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}
```

## Step 5 — UI Components

Create `src/components/{feature}s/`:
- `{Model}Table.tsx` — list view
- `{Model}Row.tsx` — single row
- `Create{Model}Modal.tsx` — create dialog

Follow existing component patterns from `src/components/repositories/` or `src/components/rules/`.

## Step 6 — Dashboard Page

Create `src/app/(dashboard)/{feature}s/page.tsx`:
```tsx
'use client';
import { use{Model}s } from '@/hooks/use{Model}s';
import { PageHeader } from '@/components/PageHeader';
import { {Model}Table } from '@/components/{feature}s/{Model}Table';

export default function {Model}sPage() {
  const { {feature}s, isLoading } = use{Model}s();
  return (
    <div>
      <PageHeader title="{Model}s" />
      <{Model}Table items={{feature}s} isLoading={isLoading} />
    </div>
  );
}
```

Add a nav link in `src/components/layout/Sidebar.tsx`.

## Step 7 — Tests

Create `src/app/api/{feature}s/{feature}s.test.ts` covering:
- GET list with pagination
- GET list with filters
- POST create with valid body
- POST create with invalid body (expect 400)
- POST create without auth (expect 401)

Run:
```bash
npm run test -- {feature}s
```

## Checklist

- [ ] Prisma model added and migrated
- [ ] Zod schemas in `src/types/schemas/{feature}.ts`
- [ ] Types exported from `src/types/index.ts`
- [ ] `handler.ts` + `create-handler.ts` + `route.ts` created
- [ ] `requireAuth()` called in all route handlers
- [ ] SWR hook in `src/hooks/`
- [ ] UI components in `src/components/{feature}s/`
- [ ] Dashboard page at `src/app/(dashboard)/{feature}s/page.tsx`
- [ ] Sidebar nav link added
- [ ] Tests written and passing
- [ ] `docs/API.md` updated with new endpoints
