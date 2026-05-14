import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryById } from './get-handler';
import { updateRepository } from './update-handler';
import { requireAuth } from '@/lib/session';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const result = await getRepositoryById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/repositories/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    // Only the repository owner may update settings
    const repo = await getRepositoryById(id);
    if (!repo.success || repo.data?.ownerId !== auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const result = await updateRepository(id, body);

    if (!result.success) {
      if (result.errors) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            issues: result.errors.reduce((acc, e) => ({ ...acc, [e.field]: e.message }), {}),
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/repositories/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
