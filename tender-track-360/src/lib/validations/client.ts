import { z } from 'zod';

export const ClientCreateSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  notes: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

export const ClientUpdateSchema = ClientCreateSchema.partial();

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;
