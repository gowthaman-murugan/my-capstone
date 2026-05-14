import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { getReviews } from './handler';

vi.mock('@/lib/db', () => ({
  prisma: {
    review: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('GET /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated reviews', async () => {
    const mockReviews = [
      {
        id: 'review-1',
        prNumber: 42,
        prTitle: 'Fix: Something',
        prUrl: 'https://github.com/org/repo/pull/42',
        headSha: 'abc123',
        baseSha: 'def456',
        status: 'COMPLETED',
        summary: 'Found 2 issues',
        createdAt: new Date(),
        updatedAt: new Date(),
        repositoryId: 'repo-1',
        authorId: 'user-1',
      },
    ];

    vi.mocked(prisma.review.findMany).mockResolvedValueOnce(mockReviews);
    vi.mocked(prisma.review.count).mockResolvedValueOnce(1);

    const result = await getReviews({ page: 1, limit: 20 });

    expect(result.success).toBe(true);
    expect(result.data?.data).toEqual(mockReviews);
    expect(result.data?.meta.total).toBe(1);
  });

  it('should filter by repository', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.review.count).mockResolvedValueOnce(0);

    await getReviews({ repositoryId: 'repo-1', page: 1, limit: 20 });

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { repositoryId: 'repo-1' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should filter by status', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.review.count).mockResolvedValueOnce(0);

    await getReviews({ status: 'PENDING', page: 1, limit: 20 });

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { status: 'PENDING' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should handle pagination with filters', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.review.count).mockResolvedValueOnce(50);

    await getReviews({ repositoryId: 'repo-1', status: 'COMPLETED', page: 2, limit: 10 });

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { repositoryId: 'repo-1', status: 'COMPLETED' },
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  });

  // Edge cases

  it('should return error for an invalid status enum value', async () => {
    const result = await getReviews({ status: 'INVALID_STATUS' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid query parameters');
    expect(prisma.review.findMany).not.toHaveBeenCalled();
  });

  it('should return error when the database throws', async () => {
    vi.mocked(prisma.review.findMany).mockRejectedValueOnce(new Error('Connection lost'));

    const result = await getReviews({ page: 1, limit: 20 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch reviews');
  });
});
