import { z } from "zod";

export const FeedbackFormSchema = z.object({
  message: z
    .string()
    .min(10, "Please provide at least 10 characters of feedback")
    .max(2000, "Feedback is too long"),
  type: z.enum(["bug", "feature", "other"]).default("other"),
  name: z.string().optional(),
  email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  honeypot: z.string().optional(),
  formMountedAt: z.number().optional(),
});

export type FeedbackFormInput = z.infer<typeof FeedbackFormSchema>;
