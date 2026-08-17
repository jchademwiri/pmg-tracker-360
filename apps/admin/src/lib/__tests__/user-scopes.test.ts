import { describe, it, expect } from "vitest";
import {
  isSystemAdmin,
  selectSystemAdmins,
  selectOrganisationUsers,
  organisationRoles,
} from "../user-scopes";
import type { UserWithMemberships } from "@/lib/admin-queries";

function makeUser(
  overrides: Partial<UserWithMemberships> = {},
): UserWithMemberships {
  return {
    id: "u1",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    plan: "free",
    role: "user",
    createdAt: new Date(),
    lastActiveOrganizationId: null,
    lastActiveOrgName: null,
    providerId: null,
    memberships: [],
    isGhost: true,
    ...overrides,
  };
}

describe("user-scopes", () => {
  it("identifies system admins by platform role", () => {
    expect(isSystemAdmin(makeUser({ role: "admin" }))).toBe(true);
    expect(isSystemAdmin(makeUser({ role: "user" }))).toBe(false);
  });

  it("splits users into two disjoint populations covering everyone", () => {
    const users = [
      makeUser({ id: "a", role: "admin" }),
      makeUser({ id: "b", role: "user" }),
      makeUser({ id: "c", role: "user" }),
    ];

    const admins = selectSystemAdmins(users);
    const orgUsers = selectOrganisationUsers(users);

    expect(admins.map((u) => u.id)).toEqual(["a"]);
    expect(orgUsers.map((u) => u.id)).toEqual(["b", "c"]);
    // Disjoint, and together they account for every user.
    expect(admins.length + orgUsers.length).toBe(users.length);
    expect(admins.some((a) => orgUsers.some((o) => o.id === a.id))).toBe(false);
  });

  // An org role must never promote someone into the console listing.
  it("does not treat an organisation admin as a system admin", () => {
    const orgAdmin = makeUser({
      id: "org-admin",
      role: "user",
      memberships: [{ orgId: "o1", orgName: "Acme", role: "admin" }],
      isGhost: false,
    });

    expect(isSystemAdmin(orgAdmin)).toBe(false);
    expect(selectSystemAdmins([orgAdmin])).toEqual([]);
    expect(selectOrganisationUsers([orgAdmin])).toEqual([orgAdmin]);
  });

  // A system admin may also hold memberships; both views must show them.
  it("keeps memberships visible for a system admin", () => {
    const staffWithOrg = makeUser({
      role: "admin",
      memberships: [
        { orgId: "o2", orgName: "Zeta", role: "owner" },
        { orgId: "o1", orgName: "Acme", role: "member" },
      ],
      isGhost: false,
    });

    expect(selectSystemAdmins([staffWithOrg])).toHaveLength(1);
    expect(organisationRoles(staffWithOrg).map((m) => m.orgName)).toEqual([
      "Acme",
      "Zeta",
    ]);
  });

  it("does not mutate the input when sorting organisation roles", () => {
    const u = makeUser({
      memberships: [
        { orgId: "o2", orgName: "Zeta", role: "owner" },
        { orgId: "o1", orgName: "Acme", role: "member" },
      ],
    });

    organisationRoles(u);

    expect(u.memberships.map((m) => m.orgName)).toEqual(["Zeta", "Acme"]);
  });
});
