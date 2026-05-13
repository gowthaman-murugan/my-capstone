import { z } from 'zod';

export const teamRoleEnum = z.enum(['ADMIN', 'MEMBER', 'VIEWER']);

export const teamMemberInviteSchema = z.object({
  githubLogin: z.string().min(1),
  role: teamRoleEnum.default('MEMBER'),
});

export const teamMemberUpdateSchema = z.object({
  role: teamRoleEnum,
});

export const teamMemberResponseSchema = z.object({
  id: z.string(),
  role: teamRoleEnum,
  createdAt: z.date(),
  userId: z.string(),
  repositoryId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string().email(),
    avatarUrl: z.string().optional(),
  }),
});

export type TeamRole = z.infer<typeof teamRoleEnum>;
export type TeamMemberInvite = z.infer<typeof teamMemberInviteSchema>;
export type TeamMemberUpdate = z.infer<typeof teamMemberUpdateSchema>;
export type TeamMember = z.infer<typeof teamMemberResponseSchema>;
