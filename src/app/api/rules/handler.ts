import { prisma } from '@/lib/db';
import { ruleListQuerySchema } from '@/types/schemas/rule';

export interface ListRulesResponse {
  success: boolean;
  data?: {
    data: Array<{
      id: string;
      name: string;
      description?: string | null;
      category: 'SECURITY' | 'PERFORMANCE' | 'STYLE' | 'CORRECTNESS';
      severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
      isEnabled: boolean;
      pattern?: string | null;
      createdAt: Date;
      updatedAt: Date;
      repositoryId?: string | null;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: string;
}

export async function getRules(query: Record<string, unknown> = {}): Promise<ListRulesResponse> {
  try {
    const parsed = ruleListQuerySchema.safeParse(query);

    if (!parsed.success) {
      return {
        success: false,
        error: 'Invalid query parameters',
      };
    }

    const { page, limit, category, repositoryId } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (repositoryId) where.repositoryId = repositoryId;

    const [rules, total] = await Promise.all([
      prisma.rule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rule.count({ where }),
    ]);

    return {
      success: true,
      data: {
        data: rules,
        meta: {
          page,
          limit,
          total,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching rules:', error);
    return {
      success: false,
      error: 'Failed to fetch rules',
    };
  }
}
