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
export type ProjectStatusUpdateInput = z.infer<
  typeof ProjectStatusUpdateSchema
>;

export const ProjectRiskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  mitigationPlan: z.string().optional(),
});

export const ProjectCloseOutSchema = z.object({
  closeOutNotes: z.string().min(10, 'Close-out notes must be at least 10 characters'),
});

export type ProjectRiskInput = z.infer<typeof ProjectRiskSchema>;
export type ProjectCloseOutInput = z.infer<typeof ProjectCloseOutSchema>;

