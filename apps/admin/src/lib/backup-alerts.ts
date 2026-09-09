import { resend, SENDER, REPLY_TO } from "@/lib/email-config";

/**
 * Failure alerts for the daily automated database backup.
 *
 * The cron route previously returned an HTTP 500 that nothing ever surfaced,
 * so a failing backup stayed silent for days. This emails BACKUP_ALERT_EMAIL
 * through the shared, validated Resend client in `email-config`.
 */

interface BackupAlertPayload {
  to: string;
  /** The error message returned by createBackup / runAutomatedBackup. */
  message: string;
}

export async function sendBackupFailureEmail({
  to,
  message,
}: BackupAlertPayload): Promise<void> {
  const timestamp = new Date().toISOString();
  const safeMessage = escapeHtml(message);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #18181b;">
      <h2 style="color: #dc2626;">Database Backup Failed</h2>
      <p>The automated database backup did not complete.</p>
      <p><strong>Time (UTC):</strong> ${timestamp}</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 16px 0;">
        <p style="margin: 0; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word;">${safeMessage}</p>
      </div>
      <p>Check the Vercel function logs for the full stack trace, then trigger a manual backup from the admin console to confirm recovery.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #71717a;">PMG Tracker 360 — automated backup monitor</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: SENDER,
    to,
    replyTo: REPLY_TO,
    subject: `[ACTION REQUIRED] Database backup failed — ${timestamp.slice(0, 10)}`,
    html,
  });

  if (error) {
    // A failed alert must never look like a success (same rule as
    // admin-invite-email): surface the Resend error to the caller so the cron
    // response records it.
    throw new Error(`Resend reported an error sending backup alert: ${error.message}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
