import { getServerSession } from "@/lib/auth";
import { db } from "@pmg/db";
import { member, user, type Role } from "@pmg/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function validateSessionAndOrg(organizationId: string) {
  // 1. Fetch current session from Better Auth
  const session = await getServerSession();

  if (!session || !session.user) {
    throw new Error("Authentication required");
  }

  // 2. Validate user is an active, non-deleted member of the target organization
  const membership = await db
    .select({
      id: member.id,
      role: member.role,
      userDeletedAt: user.deletedAt,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id),
        isNull(member.deletedAt),
        isNull(user.deletedAt),
      ),
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error("Access denied: User is not an active member of this organization");
  }

  return {
    userId: session.user.id,
    session,
    role: membership[0].role as Role, // owner, admin, manager, member
  };
}

/**
 * Validates session and organization membership, then asserts that
 * the user has one of the required roles. Throws if unauthorized.
 */
export async function requireOrgRole(
  organizationId: string,
  allowedRoles: Role[],
) {
  const context = await validateSessionAndOrg(organizationId);

  if (!allowedRoles.includes(context.role)) {
    throw new Error(
      `Insufficient permissions: action requires one of [${allowedRoles.join(", ")}], but your role is '${context.role}'.`,
    );
  }

  return context;
}

/**
 * Looks up the subscription plan of the organization owner.
 * Subscriptions are linked to the owner, not individual members.
 */
export async function getOrganizationOwnerPlan(
  organizationId: string,
): Promise<string> {
  const ownerMembership = await db
    .select({ plan: user.plan })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.role, "owner"),
        isNull(member.deletedAt),
        isNull(user.deletedAt),
      ),
    )
    .limit(1);

  return ownerMembership[0]?.plan || "free";
}
