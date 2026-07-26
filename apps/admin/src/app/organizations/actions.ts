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
    appealStatus?: string | null;
    appealReason?: string | null;
    appealedAt?: Date | null;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    plan: string;
  } | null;
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
  tenders: Array<{
    id: string;
    title: string;
    status: string;
    valueZar: number;
    closingDate: Date | null;
    createdAt: Date;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    budgetZar: number;
    createdAt: Date;
  }>;
  poTotalZar: number;
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
      appealStatus: organization.appealStatus,
      appealReason: organization.appealReason,
      appealedAt: organization.appealedAt,
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
      userPlan: user.plan,
      role: member.role,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId));

  const ownerRow = memberRows.find((m) => m.role === 'owner') || memberRows[0];
  const owner = ownerRow
    ? {
        id: ownerRow.userId,
        name: ownerRow.userName,
        email: ownerRow.userEmail,
        plan: ownerRow.userPlan || 'free',
      }
    : null;

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

  // 4. Fetch Tenders belonging to this org
  const tenderRows = await db
    .select({
      id: tender.id,
      tenderNumber: tender.tenderNumber,
      description: tender.description,
      status: tender.status,
      valueZar: tender.value,
      submissionDate: tender.submissionDate,
      createdAt: tender.createdAt,
    })
    .from(tender)
    .where(eq(tender.organizationId, orgId));

  // 5. Fetch Projects belonging to this org
  const projectRows = await db
    .select({
      id: project.id,
      projectNumber: project.projectNumber,
      description: project.description,
      status: project.status,
      awardValue: project.awardValue,
      createdAt: project.createdAt,
    })
    .from(project)
    .where(eq(project.organizationId, orgId));

  // 6. Fetch Purchase Orders sum for this org
  const poRows = await db
    .select({ amount: purchaseOrder.totalAmount })
    .from(purchaseOrder)
    .where(eq(purchaseOrder.organizationId, orgId));

  const poTotalZar = poRows.reduce(
    (acc, cur) => acc + (parseFloat(cur.amount ?? '0') || 0),
    0
  );

  return {
    org,
    owner,
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
    tenders: tenderRows.map((t) => ({
      id: t.id,
      title: t.tenderNumber ? `${t.tenderNumber} - ${t.description || 'Tender'}` : t.description || t.id,
      status: t.status,
      valueZar: parseFloat(t.valueZar ?? '0') || 0,
      closingDate: t.submissionDate,
      createdAt: t.createdAt,
    })),
    projects: projectRows.map((p) => ({
      id: p.id,
      name: p.projectNumber ? `${p.projectNumber} - ${p.description || 'Project'}` : p.description || p.id,
      status: p.status,
      budgetZar: parseFloat(p.awardValue ?? '0') || 0,
      createdAt: p.createdAt,
    })),
    poTotalZar,
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

import {
  sendAccountSuspendedEmail,
  sendPurgeScheduledEmail,
  sendDeletionCancelledEmail,
} from '@/lib/email';
import { tender, project, purchaseOrder } from '@pmg/db/schema';

/**
 * Suspends an organization (revokes access without scheduling deletion).
 */
export async function suspendOrg(orgId: string, reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const now = new Date();

    await db
      .update(organization)
      .set({
        deletedAt: now,
        deletedBy: session.user.id,
        deletionReason: reason?.trim() || 'Suspended by system administrator',
        permanentDeletionScheduledAt: null, // Suspension does NOT schedule deletion
      })
      .where(eq(organization.id, orgId));

    // Get owner email for notification
    const ownerMember = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgId), eq(member.role, 'owner')),
      with: { user: true },
    });

    if (ownerMember?.user?.email) {
      await sendAccountSuspendedEmail(
        ownerMember.user.email,
        ownerMember.user.name,
        'Organization Workspace',
        reason
      );
    }

    revalidatePath('/organizations');
    revalidatePath(`/organizations/${orgId}`);
    return { success: true, message: 'Organization suspended successfully.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to suspend organization.' };
  }
}

/**
 * Restores a suspended organization back to active state.
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
        appealStatus: 'none',
        appealReason: null,
        appealedAt: null,
      })
      .where(eq(organization.id, orgId));

    revalidatePath('/organizations');
    revalidatePath(`/organizations/${orgId}`);
    return { success: true, message: 'Organization fully restored to active status.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to restore organization.' };
  }
}

/**
 * Initiates a 30-day purge countdown to permanent deletion.
 */
export async function purgeOrg(orgId: string, reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const now = new Date();
    const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db
      .update(organization)
      .set({
        deletedAt: now,
        deletedBy: session.user.id,
        deletionReason: reason?.trim() || 'Scheduled for 30-day permanent deletion',
        permanentDeletionScheduledAt: purgeDate,
      })
      .where(eq(organization.id, orgId));

    // Send 30-day purge alert email
    const ownerMember = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgId), eq(member.role, 'owner')),
      with: { user: true },
    });

    if (ownerMember?.user?.email) {
      await sendPurgeScheduledEmail(
        ownerMember.user.email,
        ownerMember.user.name,
        'Organization Workspace',
        30
      );
    }

    revalidatePath('/organizations');
    revalidatePath(`/organizations/${orgId}`);
    return { success: true, message: '30-day permanent deletion countdown initiated.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to schedule purge.' };
  }
}

/**
 * Cancels a pending 30-day deletion countdown.
 * Note: Keeps suspension intact (deletedAt remains) while clearing the 30-day timer!
 */
export async function cancelPendingDeletion(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db
      .update(organization)
      .set({
        permanentDeletionScheduledAt: null,
        appealStatus: 'approved',
      })
      .where(eq(organization.id, orgId));

    const ownerMember = await db.query.member.findFirst({
      where: and(eq(member.organizationId, orgId), eq(member.role, 'owner')),
      with: { user: true },
    });

    if (ownerMember?.user?.email) {
      await sendDeletionCancelledEmail(
        ownerMember.user.email,
        ownerMember.user.name,
        'Organization Workspace'
      );
    }

    revalidatePath('/organizations');
    revalidatePath(`/organizations/${orgId}`);
    return { success: true, message: 'Pending 30-day deletion cancelled. Organization remains suspended.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to cancel deletion.' };
  }
}

/**
 * Submits an appeal against a 30-day pending permanent deletion.
 */
export async function submitDeletionAppeal(orgId: string, reason: string) {
  if (!reason.trim()) {
    return { success: false, error: 'Please provide an appeal explanation.' };
  }

  try {
    await db
      .update(organization)
      .set({
        appealStatus: 'pending',
        appealReason: reason.trim(),
        appealedAt: new Date(),
      })
      .where(eq(organization.id, orgId));

    revalidatePath('/organizations');
    revalidatePath(`/organizations/${orgId}`);
    return { success: true, message: 'Appeal submitted for administrator review.' };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || 'Failed to submit appeal.' };
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


