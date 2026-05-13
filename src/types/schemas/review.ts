import { z } from 'zod';

export const reviewStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
export const severityEnum = z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']);
export const categoryEnum = z.enum(['SECURITY', 'PERFORMANCE', 'STYLE', 'CORRECTNESS']);

export const findingResponseSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  lineStart: z.number().int(),
  lineEnd: z.number().int().optional(),
  severity: severityEnum,
  category: categoryEnum,
  message: z.string(),
  suggestion: z.string().optional(),
  createdAt: z.date(),
  ruleId: z.string().optional(),
});

export const reviewResponseSchema = z.object({
  id: z.string(),
  prNumber: z.number().int(),
  prTitle: z.string(),
  prUrl: z.string().url(),
  headSha: z.string(),
  baseSha: z.string(),
  status: reviewStatusEnum,
  summary: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  repositoryId: z.string(),
  authorId: z.string().optional(),
});

export const reviewDetailResponseSchema = reviewResponseSchema.extend({
  findings: z.array(findingResponseSchema),
});

export const reviewListQuerySchema = z.object({
  repositoryId: z.string().optional(),
  status: reviewStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export type ReviewStatus = z.infer<typeof reviewStatusEnum>;
export type Severity = z.infer<typeof severityEnum>;
export type Category = z.infer<typeof categoryEnum>;
export type Finding = z.infer<typeof findingResponseSchema>;
export type Review = z.infer<typeof reviewResponseSchema>;
export type ReviewDetail = z.infer<typeof reviewDetailResponseSchema>;
