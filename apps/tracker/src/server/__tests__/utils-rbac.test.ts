import { describe, expect, it } from "bun:test";

let mockCurrentRole = "member";
let mockHasMembership = true;
let mockHasSession = true;

jest.mock("@/lib/auth", () => ({
  getServerSession: jest.fn(async () =>
    mockHasSession ? { user: { id: "user-1" } } : null,
  ),
}));

jest.mock("@pmg/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: async () =>
              mockHasMembership
                ? [{ id: "member-1", role: mockCurrentRole }]
                : [],
          }),
        }),
      }),
    }),
  },
}));

import { requireOrgRole } from "../utils";

describe("requireOrgRole", () => {
  it("returns an active member context when the role is permitted", async () => {
    mockCurrentRole = "manager";

    await expect(
      requireOrgRole("organization-1", ["owner", "admin", "manager"]),
    ).resolves.toMatchObject({ userId: "user-1", role: "manager" });
  });

  it("rejects a role that is not permitted for the action", async () => {
    mockCurrentRole = "member";

    await expect(
      requireOrgRole("organization-1", ["owner", "admin"]),
    ).rejects.toThrow("Insufficient permissions");
  });
});

it("rejects revoked membership even when the session still exists", async () => {
  mockHasMembership = false;
  await expect(
    requireOrgRole("organization-1", ["owner", "admin"]),
  ).rejects.toThrow("not an active member");
  mockHasMembership = true;
});
it("rejects unauthenticated requests", async () => {
  mockHasSession = false;
  await expect(requireOrgRole("organization-1", ["owner"])).rejects.toThrow(
    "Authentication required",
  );
  mockHasSession = true;
});
