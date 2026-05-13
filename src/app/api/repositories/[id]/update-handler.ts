import { prisma } from '@/lib/db';
import { repositoryUpdateSchema } from '@/types/schemas/repository';
import { validateData, ValidationError } from '@/lib/validate';

export interface UpdateRepositoryResponse {
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
  errors?: ValidationError[];
  error?: string;
}

export async function updateRepository(
  id: string,
  input: unknown
): Promise<UpdateRepositoryResponse> {
  const validation = validateData(repositoryUpdateSchema, input);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  try {
    const repository = await prisma.repository.update({
      where: { id },
      data: validation.data,
    });

    return {
      success: true,
      data: repository,
    };
  } catch (error) {
    console.error('Error updating repository:', error);
    const message =
      error instanceof Error && error.message.includes('required but not found')
        ? 'Repository not found'
        : 'Failed to update repository';

    return {
      success: false,
      error: message,
    };
  }
}
