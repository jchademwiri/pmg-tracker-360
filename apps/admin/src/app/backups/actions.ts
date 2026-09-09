"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createBackup,
  listBackups,
  restoreFull,
  restoreOrganization,
  getOrganizationsForRestore,
  runAutomatedBackup,
  type BackupMeta,
} from "@/lib/backup";

/**
 * Auth guard: ensures the caller is an admin.
 */
async function requireAdmin(): Promise<
  { authorized: false; error: string } | { authorized: true }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { authorized: false, error: "Unauthorized: Admin access required." };
  }
  return { authorized: true };
}

/**
 * Runs a manual backup.
 */
export async function runBackupAction() {
  const auth = await requireAdmin();
  if (!auth.authorized) return { success: false, message: auth.error };

  const result = await createBackup();
  revalidatePath("/backups");
  return result;
}

/**
 * Lists all available backups.
 *
 * Returns a structured result instead of throwing: server-action errors are
 * redacted in production, so a storage failure (bad R2 credentials, missing
 * bucket) would otherwise reach the UI as an opaque catch. Surfacing the
 * specific message is what distinguishes "bucket is empty" from "bucket is
 * unreachable" — previously both rendered as "No backups yet".
 */
export async function listBackupsAction(): Promise<
  { ok: true; backups: BackupMeta[] } | { ok: false; error: string }
> {
  const auth = await requireAdmin();
  if (!auth.authorized) return { ok: false, error: auth.error };

  try {
    return { ok: true, backups: await listBackups() };
  } catch (err) {
    console.error("listBackupsAction failed:", err);
    return {
      ok: false,
      error:
        err instanceof Error && err.message
          ? err.message
          : "Failed to list backups.",
    };
  }
}

/**
 * Performs a full restore from a backup.
 */
export async function restoreFullAction(key: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) return { success: false, message: auth.error };

  const result = await restoreFull(key);
  revalidatePath("/backups");
  return result;
}

/**
 * Performs an org-level restore from a backup.
 */
export async function restoreOrgAction(key: string, orgId: string) {
  const auth = await requireAdmin();
  if (!auth.authorized) return { success: false, message: auth.error };

  const result = await restoreOrganization(key, orgId);
  revalidatePath("/backups");
  return result;
}

/**
 * Gets organizations for the restore dropdown.
 */
export async function getOrganizationsAction() {
  const auth = await requireAdmin();
  if (!auth.authorized) return [];

  return getOrganizationsForRestore();
}

/**
 * Cron-triggered automated backup (no auth needed — called internally).
 */
export async function runAutomatedBackupAction() {
  return runAutomatedBackup();
}
