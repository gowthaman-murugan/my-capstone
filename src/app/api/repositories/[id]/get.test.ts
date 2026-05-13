import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { getRepositoryById } from './get-handler';

vi.mock('@/lib/db', () => ({
  prisma: {
    repository: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/repositories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a single repository', async () => {
    const mockRepo = {
      id: 'repo-1',
      githubRepoId: 123,
      fullName: 'acme/backend',
      owner: 'acme',
      name: 'backend',
      installationId: 999,
      isActive: true,
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(mockRepo);

    const result = await getRepositoryById('repo-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockRepo);
    expect(prisma.repository.findUnique).toHaveBeenCalledWith({
      where: { id: 'repo-1' },
    });
  });

  it('should return 404 when repository not found', async () => {
    vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null);

    const result = await getRepositoryById('non-existent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Repository not found');
  });

  it('should handle database errors', async () => {
    vi.mocked(prisma.repository.findUnique).mockRejectedValueOnce(new Error('DB Error'));

    const result = await getRepositoryById('repo-1');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
