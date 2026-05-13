import { z } from 'zod';
import { categoryEnum, severityEnum } from './review';

export const ruleCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: categoryEnum,
  severity: severityEnum.default('WARNING'),
  pattern: z.string().optional(),
  repositoryId: z.string().optional(),
});

export const ruleUpdateSchema = z.object({
  severity: severityEnum.optional(),
  isEnabled: z.boolean().optional(),
  pattern: z.string().optional(),
});

export const ruleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: categoryEnum,
  severity: severityEnum,
  isEnabled: z.boolean(),
  pattern: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  repositoryId: z.string().optional(),
});

export const ruleListQuerySchema = z.object({
  repositoryId: z.string().optional(),
  category: categoryEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export type RuleCreate = z.infer<typeof ruleCreateSchema>;
export type RuleUpdate = z.infer<typeof ruleUpdateSchema>;
export type Rule = z.infer<typeof ruleResponseSchema>;
