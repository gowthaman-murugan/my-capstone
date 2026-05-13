import { z } from 'zod';

export const repositoryCreateSchema = z.object({
  githubRepoId: z.number().int().positive(),
  fullName: z.string().min(1).regex(/^[^/]+\/[^/]+$/),
  installationId: z.number().int().positive(),
  webhookSecret: z.string().min(20),
});

export const repositoryUpdateSchema = z.object({
  webhookSecret: z.string().min(20).optional(),
  isActive: z.boolean().optional(),
});

export const repositoryResponseSchema = z.object({
  id: z.string(),
  githubRepoId: z.number(),
  fullName: z.string(),
  owner: z.string(),
  name: z.string(),
  installationId: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RepositoryCreate = z.infer<typeof repositoryCreateSchema>;
export type RepositoryUpdate = z.infer<typeof repositoryUpdateSchema>;
export type RepositoryResponse = z.infer<typeof repositoryResponseSchema>;
