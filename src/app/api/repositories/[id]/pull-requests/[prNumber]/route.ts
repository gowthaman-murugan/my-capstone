import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryById } from '../../get-handler';
import { fetchGitHubPullRequest } from '@/lib/github-mcp';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/db';

async function verifyRepoAccess(repoId: string, userId: string, ownerId: string): Promise<boolean> {
  if (ownerId === userId) return true;
  const membership = await prisma.teamMember.findUnique({
    where: { userId_repositoryId: { userId, repositoryId: repoId } },
  });
  return membership !== null;
}

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

    const hasAccess = await verifyRepoAccess(id, auth, repoResult.data.ownerId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
