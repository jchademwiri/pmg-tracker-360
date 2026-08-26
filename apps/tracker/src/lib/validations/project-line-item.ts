import { z } from "zod";

export const ProjectLineItemSchema = z.object({
  itemNumber: z.string().min(1, "Item number is required"),
  sapReference: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z
    .string()
    .min(1, "Unit price is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Unit price must be a positive number",
    }),
});

export type ProjectLineItemInput = z.infer<typeof ProjectLineItemSchema>;
