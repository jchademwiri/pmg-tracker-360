import { Resend } from "resend";
import { env } from "@/env";

/**
 * Single source of truth for admin outbound email.
 *
 * This previously lived in three places with three different configurations:
 * `auth.ts` (magic links), `email.ts` (lifecycle notices, which defaulted to the
 * bare apex domain `notifications@tendertrack360.co.za`), and an unvalidated
 * `re_mock_key` fallback. Only the `contact.` subdomain is used elsewhere, so a
 * send from the apex is liable to be rejected as an unverified domain.
 */
export const resend = new Resend(env.RESEND_API_KEY);

const senderName = env.SENDER_NAME || "Tender Track 360";
const senderEmail = env.SENDER_EMAIL || "no-reply@contact.tendertrack360.co.za";

export const SENDER = `${senderName} <${senderEmail}>`;
export const REPLY_TO =
  env.REPLY_TO_EMAIL || "info@contact.tendertrack360.co.za";
