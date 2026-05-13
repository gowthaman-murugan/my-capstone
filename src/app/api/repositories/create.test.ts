import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { createRepository } from './create-handler';

vi.mock('@/lib/db', () => ({
  prisma: {
    repository: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new repository', async () => {
    const input = {
      githubRepoId: 999,
      fullName: 'test/repo',
      installationId: 123,
      webhookSecret: 'secret_123456789012345678',
    };

    const mockRepo = {
      id: 'repo-123',
      ...input,
      owner: 'test',
      name: 'repo',
      isActive: true,
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepo);

    const result = await createRepository(input, 'user-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockRepo);
    expect(prisma.repository.create).toHaveBeenCalledWith({
      data: {
        ...input,
        owner: 'test',
        name: 'repo',
        ownerId: 'user-1',
      },
    });
  });

  it('should validate required fields', async () => {
    const result = await createRepository({} as any, 'user-1');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should validate fullName format', async () => {
    const input = {
      githubRepoId: 999,
      fullName: 'invalid-format',
      installationId: 123,
      webhookSecret: 'secret_123456789012345678',
    };

    const result = await createRepository(input, 'user-1');

    expect(result.success).toBe(false);
  });

  it('should validate webhook secret length', async () => {
    const input = {
      githubRepoId: 999,
      fullName: 'test/repo',
      installationId: 123,
      webhookSecret: 'short',
    };

    const result = await createRepository(input, 'user-1');

    expect(result.success).toBe(false);
  });

  it('should handle database errors', async () => {
    const input = {
      githubRepoId: 999,
      fullName: 'test/repo',
      installationId: 123,
      webhookSecret: 'secret_123456789012345678',
    };

    vi.mocked(prisma.repository.create).mockRejectedValueOnce(
      new Error('Unique constraint failed')
    );

    const result = await createRepository(input, 'user-1');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
