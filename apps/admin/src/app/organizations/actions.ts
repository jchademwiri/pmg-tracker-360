'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { organization, member, user, invitation } from '@pmg/db/schema';
import { eq, and } from 'drizzle-orm';

/* ─── Return Types ─────────────────────────────────────────────────────── */

export type OrgDetail = {
  org: {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    metadata: string | null;
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
