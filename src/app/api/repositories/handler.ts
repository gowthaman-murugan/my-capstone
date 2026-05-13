import { z } from 'zod';
import { prisma } from '@/lib/db';
import { paginationQuerySchema } from '@/types/schemas/common';
import { repositoryResponseSchema } from '@/types/schemas/repository';

const listQuerySchema = paginationQuerySchema;

export interface ListRepositoriesResponse {
  success: boolean;
  data?: {
    data: Array<{
      id: string;
      githubRepoId: number;
      fullName: string;
      owner: string;
      name: string;
      installationId: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: string;
}

export async function getRepositories(
  query: Record<string, unknown> = {}
): Promise<ListRepositoriesResponse> {
  try {
    // Validate query parameters
    const parsed = listQuerySchema.safeParse(query);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Invalid pagination parameters',
      };
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    // Fetch repositories and total count
    const [repositories, total] = await Promise.all([
      prisma.repository.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.repository.count(),
    ]);

    return {
      success: true,
      data: {
        data: repositories,
        meta: {
          page,
          limit,
          total,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return {
      success: false,
      error: 'Failed to fetch repositories',
    };
  }
}
