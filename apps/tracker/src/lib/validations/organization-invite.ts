import { z } from "zod";

export const InviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "manager", "member"]).default("member"),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
