import { NextResponse } from "next/server";
import { runAutomatedBackup } from "@/lib/backup";
import { sendBackupFailureEmail } from "@/lib/backup-alerts";

// The backup streams every table through gzip into multipart R2 uploads, so it
// can legitimately run for minutes on a grown database. Hobby caps at 300s,
// Pro/Enterprise at 800s — Vercel clamps this to the plan maximum.
export const maxDuration = 800;

/**
 * Vercel Cron Job endpoint for automatic daily backups.
 *
 * To enable, add to vercel.json in the project root:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/backup",
 *       "schedule": "0 22 * * *"
 *     }
 *   ]
 * }
 *
 * Requires CRON_SECRET environment variable to be set.
 * Send as: Authorization: Bearer <CRON_SECRET>
 *
 * On failure, emails BACKUP_ALERT_EMAIL (if configured) via Resend.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { success: false, message: "CRON_SECRET not configured on server" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runAutomatedBackup();

    if (!result.success) {
      const alertEmail = process.env.BACKUP_ALERT_EMAIL;
      if (!alertEmail) {
        console.error(
          "Backup failed and BACKUP_ALERT_EMAIL is not set — no alert sent:",
          result.message,
        );
        return NextResponse.json(
          {
            success: false,
            message: result.message,
            alertSent: false,
            alertError: "BACKUP_ALERT_EMAIL not configured",
          },
          { status: 500 },
        );
      }

      try {
        await sendBackupFailureEmail({
          to: alertEmail,
          message: result.message,
        });
      } catch (alertErr) {
        // The backup already failed; surface both errors but keep the
        // original failure as the primary one.
        console.error("Failed to send backup failure alert:", alertErr);
        return NextResponse.json(
          {
            success: false,
            message: result.message,
            alertSent: false,
            alertError: (alertErr as Error).message,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (err) {
    const message = (err as Error).message;

    const alertEmail = process.env.BACKUP_ALERT_EMAIL;
    if (alertEmail) {
      try {
        await sendBackupFailureEmail({ to: alertEmail, message });
      } catch (alertErr) {
        console.error("Failed to send backup failure alert:", alertErr);
        return NextResponse.json(
          {
            success: false,
            message,
            alertSent: false,
            alertError: (alertErr as Error).message,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
