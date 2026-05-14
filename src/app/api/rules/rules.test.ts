import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { getRules } from './handler';

vi.mock('@/lib/db', () => ({
  prisma: {
    rule: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('GET /api/rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated rules', async () => {
    const mockRules = [
      {
        id: 'rule-1',
        name: 'SQL Injection Detection',
        description: 'Detects SQL injection patterns',
        category: 'SECURITY',
        severity: 'CRITICAL',
        isEnabled: true,
        pattern: 'SELECT.*FROM.*WHERE',
        createdAt: new Date(),
        updatedAt: new Date(),
        repositoryId: null,
      },
    ];

    vi.mocked(prisma.rule.findMany).mockResolvedValueOnce(mockRules);
    vi.mocked(prisma.rule.count).mockResolvedValueOnce(1);

    const result = await getRules({ page: 1, limit: 20 });

    expect(result.success).toBe(true);
    expect(result.data?.data).toEqual(mockRules);
  });

  it('should filter by category', async () => {
    vi.mocked(prisma.rule.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.rule.count).mockResolvedValueOnce(0);

    await getRules({ category: 'SECURITY', page: 1, limit: 20 });

    expect(prisma.rule.findMany).toHaveBeenCalledWith({
      where: { category: 'SECURITY' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should filter by repository', async () => {
    vi.mocked(prisma.rule.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.rule.count).mockResolvedValueOnce(0);

    await getRules({ repositoryId: 'repo-1', page: 1, limit: 20 });

    expect(prisma.rule.findMany).toHaveBeenCalledWith({
      where: { repositoryId: 'repo-1' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should handle combined filters', async () => {
    vi.mocked(prisma.rule.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.rule.count).mockResolvedValueOnce(0);

    await getRules({ category: 'PERFORMANCE', repositoryId: 'repo-1', page: 1, limit: 20 });

    expect(prisma.rule.findMany).toHaveBeenCalledWith({
      where: { category: 'PERFORMANCE', repositoryId: 'repo-1' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  // Edge cases

  it('should return error for an invalid category enum value', async () => {
    const result = await getRules({ category: 'INVALID_CATEGORY' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid query parameters');
    expect(prisma.rule.findMany).not.toHaveBeenCalled();
  });

  it('should return error when the database throws', async () => {
    vi.mocked(prisma.rule.findMany).mockRejectedValueOnce(new Error('Timeout'));

    const result = await getRules({ page: 1, limit: 20 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch rules');
  });
});
