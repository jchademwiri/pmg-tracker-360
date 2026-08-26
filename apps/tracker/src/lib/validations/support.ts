import { z } from "zod";

export const SupportTicketCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Enter a valid email address"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const SupportReplySchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long"),
});

export type SupportTicketCreateInput = z.infer<
  typeof SupportTicketCreateSchema
>;
export type SupportReplyInput = z.infer<typeof SupportReplySchema>;
