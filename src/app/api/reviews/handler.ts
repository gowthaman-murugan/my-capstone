import { z } from 'zod';
import { prisma } from '@/lib/db';
import { paginationQuerySchema } from '@/types/schemas/common';
import { reviewListQuerySchema } from '@/types/schemas/review';

export interface ListReviewsResponse {
  success: boolean;
  data?: {
    data: Array<{
      id: string;
      prNumber: number;
      prTitle: string;
      prUrl: string;
      headSha: string;
      baseSha: string;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
      summary?: string | null;
      createdAt: Date;
      updatedAt: Date;
      repositoryId: string;
      authorId?: string | null;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: string;
}

export async function getReviews(query: Record<string, unknown> = {}): Promise<ListReviewsResponse> {
  try {
    const parsed = reviewListQuerySchema.safeParse(query);

    if (!parsed.success) {
      return {
        success: false,
        error: 'Invalid query parameters',
      };
    }

    const { page, limit, repositoryId, status } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (repositoryId) where.repositoryId = repositoryId;
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      success: true,
      data: {
        data: reviews,
        meta: {
          page,
          limit,
          total,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return {
      success: false,
      error: 'Failed to fetch reviews',
    };
  }
}
