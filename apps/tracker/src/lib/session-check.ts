'use server';

import { getServerSession } from '@/lib/auth';
import { db } from '@pmg/db';
import { member, organization } from '@pmg/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function checkUserSession() {
  try {
    const session = await getServerSession();

    if (!session) {
      return { hasSession: false, hasOrganization: false };
    }

    const memberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(
        and(
          eq(member.userId, session.user.id),
          isNull(organization.deletedAt)
        )
      );

    const hasOrganization = !!session.session.activeOrganizationId;

    return {
      hasSession: true,
      hasOrganization,
      activeOrganizationId: session.session.activeOrganizationId,
      organizationCount: memberships.length,
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { hasSession: false, hasOrganization: false };
  }
}
