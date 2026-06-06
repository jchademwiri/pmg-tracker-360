import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { member } from '@pmg/db/schema';
import { and, eq } from 'drizzle-orm';

export async function validateSessionAndOrg(organizationId: string) {
  // 1. Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
