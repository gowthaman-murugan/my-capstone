import { z } from 'zod';

// Standard response envelopes
export const successResponseSchema = z.object({
  data: z.unknown(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  issues: z.record(z.string(), z.unknown()).optional(),
});

// Pagination metadata
export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const listResponseSchema = z.object({
  data: z.array(z.unknown()),
  meta: paginationMetaSchema,
});

// Common query parameters
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});
