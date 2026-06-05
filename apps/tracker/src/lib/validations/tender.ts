import { z } from 'zod';

export const TenderCreateSchema = z.object({
  tenderNumber: z.string().min(1, 'Tender number is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  submissionDate: z.date().optional().nullable(),
  value: z.string().optional(),
  status: z.enum(['open', 'closed', 'evaluation', 'awarded', 'lost']),
  validityDays: z.number().int().nonnegative().nullable().optional(),
  validityDate: z.coerce.date().optional().nullable(),
});

export const TenderUpdateSchema = TenderCreateSchema.partial().extend({
  tenderNumber: z.string().min(1, 'Tender number is required').optional(),
});

export const TenderStatusUpdateSchema = z.object({
  status: z.enum(['open', 'closed', 'evaluation', 'awarded', 'lost']),
});

export const TenderSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['open', 'closed', 'evaluation', 'awarded', 'lost']).optional(),
  clientId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type TenderCreateInput = z.infer<typeof TenderCreateSchema>;
export type TenderUpdateInput = z.infer<typeof TenderUpdateSchema>;
export type TenderStatusUpdateInput = z.infer<typeof TenderStatusUpdateSchema>;
export type TenderSearchInput = z.infer<typeof TenderSearchSchema>;
