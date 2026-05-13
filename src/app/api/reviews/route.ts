import { NextRequest, NextResponse } from 'next/server';
import { getReviews } from './handler';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '20';
    const repositoryId = url.searchParams.get('repositoryId') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const result = await getReviews({
      page: parseInt(page),
      limit: parseInt(limit),
      repositoryId,
      status,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data!.data, meta: result.data!.meta }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
