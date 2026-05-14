import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryById } from '../get-handler';
import { fetchGitHubRepoInfo } from '@/lib/github-mcp';
import { requireAuth } from '@/lib/session';

/**
 * GET /api/repositories/[id]/github-info
 *
 * Fetches live repository metadata from GitHub via the GitHub MCP server.
 * Returns real-time data like description, language, star count, and open
 * issue count without requiring a webhook event to trigger it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const repoResult = await getRepositoryById(id);
    if (!repoResult.success || !repoResult.data) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const { owner, name } = repoResult.data;

    const githubInfo = await fetchGitHubRepoInfo(owner, name);

    return NextResponse.json({ data: githubInfo }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('GITHUB_TOKEN')) {
      return NextResponse.json(
        { error: 'GitHub integration not configured. Set GITHUB_TOKEN to enable MCP.' },
        { status: 503 }
      );
    }

    console.error('Error fetching GitHub info via MCP:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub repository info' }, { status: 502 });
  }
}
