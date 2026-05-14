import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryById } from '../../get-handler';
import { fetchGitHubPullRequest } from '@/lib/github-mcp';
import { requireAuth } from '@/lib/session';

/**
 * GET /api/repositories/[id]/pull-requests/[prNumber]
 *
 * Fetches live pull request details from GitHub via the GitHub MCP server.
 * Used by the review engine to retrieve PR metadata before analysis.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prNumber: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id, prNumber: prNumberStr } = await params;
  const prNumber = parseInt(prNumberStr, 10);

  if (isNaN(prNumber) || prNumber < 1) {
    return NextResponse.json({ error: 'Invalid PR number' }, { status: 400 });
  }

  try {
    const repoResult = await getRepositoryById(id);
    if (!repoResult.success || !repoResult.data) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const { owner, name } = repoResult.data;

    const prInfo = await fetchGitHubPullRequest(owner, name, prNumber);

    return NextResponse.json({ data: prInfo }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('GITHUB_TOKEN')) {
      return NextResponse.json(
        { error: 'GitHub integration not configured. Set GITHUB_TOKEN to enable MCP.' },
        { status: 503 }
      );
    }

    console.error('Error fetching PR via MCP:', error);
    return NextResponse.json({ error: 'Failed to fetch pull request info' }, { status: 502 });
  }
}
