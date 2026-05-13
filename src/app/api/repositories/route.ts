import { NextRequest, NextResponse } from 'next/server';
import { getRepositories } from './handler';
import { createRepository } from './create-handler';
import { paginationQuerySchema } from '@/types/schemas/common';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '20';

    const query = paginationQuerySchema.safeParse({ page: parseInt(page), limit: parseInt(limit) });

    if (!query.success) {
      return NextResponse.json(
        {
          error: 'Invalid pagination parameters',
          issues: query.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await getRepositories(query.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data.data, meta: result.data.meta }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/repositories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = 'user-123'; // TODO: Get from session

    const result = await createRepository(body, userId);

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

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/repositories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
