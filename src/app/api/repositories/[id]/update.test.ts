import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { updateRepository } from './update-handler';

vi.mock('@/lib/db', () => ({
  prisma: {
    repository: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('PATCH /api/repositories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update repository webhook secret', async () => {
    const mockUpdated = {
      id: 'repo-1',
      githubRepoId: 123,
      fullName: 'acme/backend',
      owner: 'acme',
      name: 'backend',
      installationId: 999,
      isActive: true,
      ownerId: 'user-1',
      webhookSecret: 'new_secret_123456789012345',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.repository.update).mockResolvedValueOnce(mockUpdated);

    const result = await updateRepository('repo-1', { webhookSecret: 'new_secret_123456789012345' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUpdated);
  });

  it('should update repository active status', async () => {
    const mockUpdated = {
      id: 'repo-1',
      githubRepoId: 123,
      fullName: 'acme/backend',
      owner: 'acme',
      name: 'backend',
      installationId: 999,
      isActive: false,
      ownerId: 'user-1',
      webhookSecret: 'secret',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.repository.update).mockResolvedValueOnce(mockUpdated);

    const result = await updateRepository('repo-1', { isActive: false });

    expect(result.success).toBe(true);
    expect(result.data?.isActive).toBe(false);
  });

  it('should validate input data', async () => {
    const result = await updateRepository('repo-1', { isActive: 'invalid' as any });

    expect(result.success).toBe(false);
  });

  it('should handle repository not found', async () => {
    vi.mocked(prisma.repository.update).mockRejectedValueOnce(
      new Error('An operation failed because it depends on one or more records that were required but not found')
    );

    const result = await updateRepository('non-existent', { isActive: true });

    expect(result.success).toBe(false);
  });
});
