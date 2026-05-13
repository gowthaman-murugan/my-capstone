import { prisma } from '@/lib/db';
import { repositoryCreateSchema } from '@/types/schemas/repository';
import { validateData, ValidationError } from '@/lib/validate';

export interface CreateRepositoryResponse {
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

export async function createRepository(
  input: unknown,
  userId: string
): Promise<CreateRepositoryResponse> {
  // Validate input
  const validation = validateData(repositoryCreateSchema, input);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  try {
    const { fullName, githubRepoId, installationId, webhookSecret } = validation.data;
    const [owner, name] = fullName.split('/');

    const repository = await prisma.repository.create({
      data: {
        githubRepoId,
        fullName,
        owner,
        name,
        installationId,
        webhookSecret,
        ownerId: userId,
      },
    });

    return {
      success: true,
      data: repository,
    };
  } catch (error) {
    console.error('Error creating repository:', error);
    const message =
      error instanceof Error && error.message.includes('Unique constraint failed')
        ? 'Repository already registered'
        : 'Failed to create repository';

    return {
      success: false,
      error: message,
    };
  }
}
