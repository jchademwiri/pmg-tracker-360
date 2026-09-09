/**
 * Next.js instrumentation hook — runs once when the server process boots.
 *
 * Validates the R2 backup credentials at deploy time: rotated or missing
 * credentials previously surfaced only as a silent 401 on the daily backup or
 * an empty backups page. A broken check logs a prominent error and, in
 * production, emails BACKUP_ALERT_EMAIL once per boot. Cron-driven failures
 * keep using the per-run alerts in the backup cron route.
 */
export async function register(): Promise<void> {
  // Only run in the Node.js server runtime (skips edge middleware and builds).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { checkR2Connection } = await import("@/lib/r2-health");
    const result = await checkR2Connection();

    if (result.ok) {
      console.log(
        `[startup] R2 backup storage OK (${result.latencyMs ?? "?"}ms): ${result.message}`,
      );
      return;
    }

    console.error(`[startup] R2 BACKUP STORAGE PROBLEM: ${result.message}`);

    if (process.env.NODE_ENV === "production" && process.env.BACKUP_ALERT_EMAIL) {
      try {
        const { sendBackupFailureEmail } = await import("@/lib/backup-alerts");
        await sendBackupFailureEmail({
          to: process.env.BACKUP_ALERT_EMAIL,
          message: `Startup credential check failed (${result.reason}): ${result.message}`,
        });
      } catch (alertErr) {
        console.error(
          "[startup] Failed to send R2 credential alert:",
          alertErr instanceof Error ? alertErr.message : alertErr,
        );
      }
    }
  } catch (err) {
    // A failing health check must never prevent the app from booting.
    console.error(
      "[startup] R2 credential check crashed:",
      err instanceof Error ? err.message : err,
    );
  }
}
