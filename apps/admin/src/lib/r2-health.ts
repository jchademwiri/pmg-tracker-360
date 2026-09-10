import "server-only";

import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getBackupStorage } from "@/lib/backup";

/**
 * R2 credential health check for the admin app.
 *
 * The backups feature previously failed silently in production: `listBackups`
 * swallowed a 401 into an empty list, and the cron backup only logged to
 * console — so rotated/missing R2 credentials surfaced as "No backups yet"
 * with no error anywhere. This check performs a real authenticated request
 * (HeadBucket), so it validates env-var completeness *and* credential
 * validity, and is wired into app startup (instrumentation.ts) plus
 * /api/health/r2 for platform monitoring.
 */

export interface R2HealthResult {
  ok: boolean;
  /** Machine-readable failure class for dashboards and tests. */
  reason:
    | "not_configured"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "network_error"
    | "unknown";
  /** Human-readable detail; safe to log (never includes credentials). */
  message: string;
  /** Rough latency of the authenticated round-trip, in milliseconds. */
  latencyMs?: number;
}

function classifyError(err: unknown): R2HealthResult {
  const error = err as {
    name?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
  };
  const status = error?.$metadata?.httpStatusCode;
  const name = error?.name ?? "";
  const detail = error?.message ?? "Unknown error";

  if (status === 401 || status === 403 || name === "Unauthorized" || name === "Forbidden") {
    const reason = status === 401 || name === "Unauthorized" ? "unauthorized" : "forbidden";
    return {
      ok: false,
      reason,
      message:
        "R2 credentials are invalid or were rotated (auth rejected). " +
        "Check R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY on the deployment. " +
        `Detail: ${detail}`,
    };
  }
  if (status === 404 || name === "NotFound") {
    return {
      ok: false,
      reason: "not_found",
      message:
        "R2 credentials work but the bucket does not exist or is not accessible. " +
        `Check R2_BUCKET_NAME. Detail: ${detail}`,
    };
  }
  if (
    name === "CredentialsProviderError" ||
    /credential/i.test(detail)
  ) {
    return {
      ok: false,
      reason: "unauthorized",
      message:
        "R2 credentials are missing or malformed. " +
        "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME. " +
        `Detail: ${detail}`,
    };
  }
  if (
    name === "NetworkingError" ||
    name === "RequestTimeout" ||
    name === "ECONNREFUSED" ||
    /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|network/i.test(detail)
  ) {
    return {
      ok: false,
      reason: "network_error",
      message: `Could not reach the R2 endpoint. Detail: ${detail}`,
    };
  }
  return {
    ok: false,
    reason: "unknown",
    message: detail,
  };
}

/**
 * Performs a HeadBucket against the configured R2 bucket.
 * Returns a structured result instead of throwing so callers (startup hook,
 * health endpoint) can render any outcome without try/catch plumbing.
 */
export async function checkR2Connection(): Promise<R2HealthResult> {
  const storage = getBackupStorage();
  if (!storage) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "R2 storage is not configured. Set R2_ACCOUNT_ID (or S3_API), " +
        "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME.",
    };
  }

  const startedAt = Date.now();
  try {
    await storage.s3.send(new HeadBucketCommand({ Bucket: storage.bucket }));
    return {
      ok: true,
      reason: "unknown",
      message: `R2 bucket "${storage.bucket}" is reachable and credentials are valid.`,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    return classifyError(err);
  }
}
