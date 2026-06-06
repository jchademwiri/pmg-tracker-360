import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .optional()
  .nullable();

const optionalEmail = z
  .union([z.string().trim().email('Enter a valid email address'), z.literal('')])
  .transform((value) => value || null)
  .optional()
  .nullable();

export const TenderCreateSchema = z.object({
  tenderNumber: z.string().min(1, 'Tender number is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  submissionDate: z.coerce.date().optional().nullable(),
  value: z.string().optional(),
  status: z.enum(['open', 'closed', 'evaluation', 'awarded', 'lost', 'cancelled']),
  validityDays: z.number().int().nonnegative().nullable().optional(),
  validityDate: z.coerce.date().optional().nullable(),
  contactName: optionalText,
  contactEmail: optionalEmail,
  contactPhone: optionalText,
  briefingDate: z.coerce.date().optional().nullable(),
  briefingLocation: z.string().optional().nullable(),
  isBriefingMandatory: z.boolean().default(false),
  briefingAttended: z.boolean().default(false),
});

export const TenderUpdateSchema = TenderCreateSchema.partial().extend({
  tenderNumber: z.string().min(1, 'Tender number is required').optional(),
});

export const TenderStatusUpdateSchema = z.object({
  status: z.enum(['open', 'closed', 'evaluation', 'awarded', 'lost', 'cancelled']),
});

export const TenderSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['open', 'closed', 'evaluation', 'awarded', 'lost', 'cancelled']).optional(),
  clientId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export type TenderCreateInput = z.infer<typeof TenderCreateSchema>;
export type TenderUpdateInput = z.infer<typeof TenderUpdateSchema>;
export type TenderStatusUpdateInput = z.infer<typeof TenderStatusUpdateSchema>;
export type TenderSearchInput = z.infer<typeof TenderSearchSchema>;
