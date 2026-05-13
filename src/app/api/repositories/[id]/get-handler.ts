import { prisma } from '@/lib/db';

export interface GetRepositoryResponse {
  success: boolean;
  data?: {
    id: string;
    githubRepoId: number;
    fullName: string;
    owner: string;
    name: string;
    installationId: number;
    isActive: boolean;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

export async function getRepositoryById(id: string): Promise<GetRepositoryResponse> {
  try {
    const repository = await prisma.repository.findUnique({
      where: { id },
    });

    if (!repository) {
      return {
        success: false,
        error: 'Repository not found',
      };
    }

    return {
      success: true,
      data: repository,
    };
  } catch (error) {
    console.error('Error fetching repository:', error);
    return {
      success: false,
      error: 'Failed to fetch repository',
    };
  }
}
