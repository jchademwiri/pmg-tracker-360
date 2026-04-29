import { z } from 'zod';

export const ProjectCreateSchema = z.object({
  projectNumber: z.string().min(1, 'Project number is required'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  tenderId: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial().extend({
  projectNumber: z.string().min(1, 'Project number is required').optional(),
});

export const ProjectStatusUpdateSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']),
});

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;
export type ProjectStatusUpdateInput = z.infer<typeof ProjectStatusUpdateSchema>;
