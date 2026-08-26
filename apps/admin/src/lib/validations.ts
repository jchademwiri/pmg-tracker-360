import { z } from "zod";

// --- Auth Forms ---

export const AdminLoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AdminSetupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const AdminSetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- Admin Management ---

export const AdminInviteSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Enter a valid email address"),
});

// --- Organization ---

export const AdminOrgEditSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Name is too long"),
  slug: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z0-9-]+$/.test(val),
      "Slug must be lowercase with hyphens only",
    ),
});

// --- Support & Feedback Replies ---

export const AdminReplySchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long"),
});

export const AdminFeedbackReplySchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message is too long"),
});

// --- Types ---

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
export type AdminSetupInput = z.infer<typeof AdminSetupSchema>;
export type AdminSetPasswordInput = z.infer<typeof AdminSetPasswordSchema>;
export type AdminInviteInput = z.infer<typeof AdminInviteSchema>;
export type AdminOrgEditInput = z.infer<typeof AdminOrgEditSchema>;
export type AdminReplyInput = z.infer<typeof AdminReplySchema>;
export type AdminFeedbackReplyInput = z.infer<typeof AdminFeedbackReplySchema>;
