import { getServerSession } from '@/lib/auth';
import { db } from '@pmg/db';
import { member, user } from '@pmg/db/schema';
import { and, eq } from 'drizzle-orm';

export async function validateSessionAndOrg(organizationId: string) {
  // 1. Fetch current session from Better Auth
  const session = await getServerSession();

  if (!session || !session.user) {
    throw new Error('Authentication required');
  }

  // 2. Validate user is a member of the target organization
  const membership = await db
    .select()
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error('Access denied: User is not a member of this organization');
  }

  return {
    userId: session.user.id,
    session,
    role: membership[0].role, // owner, admin, manager, member
  };
}

/**
 * Looks up the subscription plan of the organization owner.
 * Subscriptions are linked to the owner, not individual members.
 */
export async function getOrganizationOwnerPlan(organizationId: string): Promise<string> {
  const ownerMembership = await db
    .select({ plan: user.plan })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.role, 'owner')
      )
    )
    .limit(1);

  return ownerMembership[0]?.plan || 'free';
}
