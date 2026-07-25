'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { organization, member, user, invitation } from '@pmg/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/* ─── Return Types ─────────────────────────────────────────────────────── */

export type OrgDetail = {
  org: {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    metadata: Record<string, unknown> | string | null;
    createdAt: Date;
    deletedAt: Date | null;
    deletionReason: string | null;
    permanentDeletionScheduledAt: Date | null;
  };
  members: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    expiresAt: Date;
    status: string;
  }>;
};

/* ─── Server Action ────────────────────────────────────────────────────── */

export async function getOrgDetail(orgId: string): Promise<OrgDetail> {
  // Re-verify admin session on every call
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // 1. Fetch org record
  const [org] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
      createdAt: organization.createdAt,
      deletedAt: organization.deletedAt,
      deletionReason: organization.deletionReason,
      permanentDeletionScheduledAt: organization.permanentDeletionScheduledAt,
    })
    .from(organization)
    .where(eq(organization.id, orgId));

  if (!org) {
    throw new Error('Organisation not found');
  }

  // 2. Fetch all members joined to user for name/email
  const memberRows = await db
    .select({
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId));

  // 3. Fetch all pending invitations for this org
  const invitationRows = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, orgId),
        eq(invitation.status, 'pending')
      )
    );

  return {
    org,
    members: memberRows.map((m) => ({
      userId: m.userId,
      userName: m.userName,
      userEmail: m.userEmail,
      role: m.role,
    })),
    invitations: invitationRows.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role ?? 'member',
      expiresAt: inv.expiresAt,
      status: inv.status,
    })),
  };
}

/**
 * Updates an organization's name and slug.
 */
export async function updateOrgDetails(
  orgId: string,
  name: string,
  slug?: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const trimmedName = name.trim();
    const trimmedSlug = slug?.trim() || null;

    if (!trimmedName) {
      return { success: false, error: 'Organization name is required.' };
    }

    await db
      .update(organization)
      .set({
        name: trimmedName,
        slug: trimmedSlug,
      })
      .where(eq(organization.id, orgId));

    return { success: true, message: 'Organization updated successfully.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to update organization.' };
  }
}

/**
 * Suspends an organization (soft deletion + schedules 72h purge date).
 */
export async function suspendOrg(orgId: string, reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const now = new Date();
    const purgeDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

    await db
      .update(organization)
      .set({
        deletedAt: now,
        deletedBy: session.user.id,
        deletionReason: reason?.trim() || 'Suspended by system administrator',
        permanentDeletionScheduledAt: purgeDate,
      })
      .where(eq(organization.id, orgId));

    return { success: true, message: 'Organization suspended and purge scheduled.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to suspend organization.' };
  }
}

/**
 * Restores a suspended organization.
 */
export async function restoreOrg(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db
      .update(organization)
      .set({
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
        permanentDeletionScheduledAt: null,
      })
      .where(eq(organization.id, orgId));

    return { success: true, message: 'Organization restored successfully.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to restore organization.' };
  }
}

/**
 * Immediately purges an organization permanently from the database.
 */
export async function purgeOrg(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db.delete(organization).where(eq(organization.id, orgId));
    return { success: true, message: 'Organization permanently purged.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to purge organization.' };
  }
}

/**
 * Removes a member from an organization.
 */
export async function removeOrgMember(orgId: string, userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db
      .delete(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)));

    return { success: true, message: 'Member removed from organization.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to remove member.' };
  }
}

/**
 * Bulk suspends multiple organizations.
 */
export async function bulkSuspendOrgs(orgIds: string[], reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  if (!orgIds || orgIds.length === 0) {
    return { success: false, error: 'No organizations selected.' };
  }

  try {
    const now = new Date();
    const purgeDate = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    await db
      .update(organization)
      .set({
        deletedAt: now,
        deletedBy: session.user.id,
        deletionReason: reason?.trim() || 'Bulk suspended by system administrator',
        permanentDeletionScheduledAt: purgeDate,
      })
      .where(inArray(organization.id, orgIds));

    revalidatePath('/organizations');
    return { success: true, message: `Suspended ${orgIds.length} organization(s).` };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed bulk org suspension.' };
  }
}

/**
 * Bulk restores multiple organizations.
 */
export async function bulkRestoreOrgs(orgIds: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  if (!orgIds || orgIds.length === 0) {
    return { success: false, error: 'No organizations selected.' };
  }

  try {
    await db
      .update(organization)
      .set({
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
        permanentDeletionScheduledAt: null,
      })
      .where(inArray(organization.id, orgIds));

    revalidatePath('/organizations');
    return { success: true, message: `Restored ${orgIds.length} organization(s).` };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed bulk org restoration.' };
  }
}

/**
 * Bulk purges multiple organizations permanently.
 */
export async function bulkPurgeOrgs(orgIds: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  if (!orgIds || orgIds.length === 0) {
    return { success: false, error: 'No organizations selected.' };
  }

  try {
    await db.delete(organization).where(inArray(organization.id, orgIds));
    revalidatePath('/organizations');
    return { success: true, message: `Permanently purged ${orgIds.length} organization(s).` };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed bulk org purge.' };
  }
}


