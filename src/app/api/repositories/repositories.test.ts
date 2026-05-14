import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { getRepositories } from './handler';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    repository: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('GET /api/repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of repositories with pagination', async () => {
    const mockRepos = [
      {
        id: 'repo-1',
        githubRepoId: 123,
        fullName: 'acme/backend',
        owner: 'acme',
        name: 'backend',
        installationId: 999,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(prisma.repository.findMany).mockResolvedValueOnce(mockRepos);
    vi.mocked(prisma.repository.count).mockResolvedValueOnce(1);

    const result = await getRepositories({ page: 1, limit: 20 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      data: mockRepos,
      meta: {
        page: 1,
        limit: 20,
        total: 1,
      },
    });
  });

  it('should handle pagination correctly', async () => {
    vi.mocked(prisma.repository.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.repository.count).mockResolvedValueOnce(50);

    const result = await getRepositories({ page: 2, limit: 10 });

    expect(result.success).toBe(true);
    expect(prisma.repository.findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should return error response on database error', async () => {
    vi.mocked(prisma.repository.findMany).mockRejectedValueOnce(new Error('DB Error'));

    const result = await getRepositories({ page: 1, limit: 20 });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should use default pagination values', async () => {
    vi.mocked(prisma.repository.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.repository.count).mockResolvedValueOnce(0);

    await getRepositories({});

    expect(prisma.repository.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  // Edge cases

  it('should return error for a negative page number', async () => {
    const result = await getRepositories({ page: -1 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid pagination parameters');
    expect(prisma.repository.findMany).not.toHaveBeenCalled();
  });

  it('should return error for a zero limit', async () => {
    const result = await getRepositories({ page: 1, limit: 0 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid pagination parameters');
    expect(prisma.repository.findMany).not.toHaveBeenCalled();
  });
});
