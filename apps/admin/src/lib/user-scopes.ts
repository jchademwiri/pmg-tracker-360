import type { UserWithMemberships } from "@/lib/admin-queries";

/**
 * The platform-level role stored on `user.role`. This is distinct from
 * `member.role`, which is scoped to a single organisation.
 */
export const SYSTEM_ROLE_ADMIN = "admin";

/** Platform staff: can sign in to this admin console. */
export function isSystemAdmin(u: Pick<UserWithMemberships, "role">): boolean {
  return u.role === SYSTEM_ROLE_ADMIN;
}

/**
 * Splits the flat user list into the two populations the console treats
 * separately.
 *
 * A user's platform role (`user.role`) and their organisation roles
 * (`member.role`) are independent, so a system admin may also hold
 * memberships. Membership is shown on both views; the split is by platform
 * role alone, which is what actually grants access to this console.
 */
export function selectSystemAdmins(
  users: UserWithMemberships[],
): UserWithMemberships[] {
  return users.filter(isSystemAdmin);
}

export function selectOrganisationUsers(
  users: UserWithMemberships[],
): UserWithMemberships[] {
  return users.filter((u) => !isSystemAdmin(u));
}

/** Distinct organisations a user belongs to, sorted by name. */
export function organisationRoles(
  u: UserWithMemberships,
): Array<{ orgId: string; orgName: string; role: string }> {
  return [...u.memberships].sort((a, b) => a.orgName.localeCompare(b.orgName));
}
