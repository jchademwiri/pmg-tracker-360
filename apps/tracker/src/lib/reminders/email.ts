import { Resend } from "resend";
import type { ReactElement } from "react";

// Mirrors the Resend client setup in `src/lib/auth.ts` (kept independent so
// the cron sweep doesn't need to import/initialize the full Better Auth
// config just to send an email).
const resend = new Resend(
  process.env.RESEND_API_KEY || "re_dummy_key_for_testing",
);

const senderName = process.env.SENDER_NAME || "Tender Track 360";
const senderEmail =
  process.env.SENDER_EMAIL || "no-reply@contact.tendertrack360.co.za";
const SENDER = `${senderName} <${senderEmail}>`;
const REPLY_TO =
  process.env.REPLY_TO_EMAIL || "info@contact.tendertrack360.co.za";

/**
 * Set DRY_RUN_EMAILS=true to log rendered reminder emails to the console
 * instead of sending them via Resend — use this while testing the sweep
 * locally against real org data, to avoid spamming real inboxes.
 */
const DRY_RUN = process.env.DRY_RUN_EMAILS === "true";

export async function sendReminderEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  if (DRY_RUN) {
    console.log(`[DRY_RUN_EMAILS] Would send "${subject}" to ${to}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: SENDER,
    to,
    subject,
    replyTo: REPLY_TO,
    react,
  });

  if (error) {
    throw new Error(`Failed to send reminder email to ${to}: ${error.message}`);
  }
}
