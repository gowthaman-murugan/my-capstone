import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryById } from '../get-handler';
import { fetchGitHubRepoInfo } from '@/lib/github-mcp';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/db';

async function verifyRepoAccess(repoId: string, userId: string, ownerId: string): Promise<boolean> {
  if (ownerId === userId) return true;
  const membership = await prisma.teamMember.findUnique({
    where: { userId_repositoryId: { userId, repositoryId: repoId } },
  });
  return membership !== null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

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
