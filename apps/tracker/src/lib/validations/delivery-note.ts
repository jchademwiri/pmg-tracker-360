import { z } from "zod";

export const DeliveryNoteSchema = z.object({
  deliveryNoteNumber: z.string().min(1, "Delivery note number is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  receivedAt: z.date({ required_error: "Received date is required" }),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        lineItemId: z.string().min(1, "Line item is required"),
        quantityDelivered: z
          .string()
          .min(1, "Quantity is required")
          .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Quantity must be a positive number",
          }),
      }),
    )
    .min(1, "At least one delivery item is required"),
});

export type DeliveryNoteInput = z.infer<typeof DeliveryNoteSchema>;
