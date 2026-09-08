import { describe, expect, it } from "bun:test";

let mockCurrentRole = "member";

jest.mock("@/lib/auth", () => ({
  getServerSession: jest.fn(async () => ({ user: { id: "user-1" } })),
}));

jest.mock("@pmg/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: async () => [{ id: "member-1", role: mockCurrentRole }],
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
