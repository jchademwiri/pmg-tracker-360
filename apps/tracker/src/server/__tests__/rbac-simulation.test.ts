import { describe, it, expect, beforeEach } from "bun:test";

// Logic control for mocks
let permissionGranted = true;
let mockRole = "admin";
let selectCallCounter = 0;

// Mock dependencies
jest.mock("@pmg/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => {
            selectCallCounter++;
            if (selectCallCounter % 2 === 1) {
              return [{ id: "proj-1", organizationId: "org-1" }];
            }
            return [];
          },
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => [{ id: "po-1", status: "open" }],
      }),
    }),
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      hasPermission: jest.fn(async () => ({ success: permissionGranted })),
    },
  },
}));

jest.mock("../utils", () => ({
  validateSessionAndOrg: jest.fn(async () => ({
    userId: "user-1",
    session: { user: { id: "user-1" } },
    role: "admin",
  })),
  requireOrgRole: jest.fn(async (_org: string, roles: string[]) => {
    if (!roles.includes(mockRole)) throw new Error("Insufficient permissions");
    return {
      userId: "user-1",
      session: { user: { id: "user-1" } },
      role: mockRole,
    };
  }),
}));

jest.mock("next/headers", () => ({
  headers: async () => ({}),
}));

jest.mock("next/cache", () => ({
  revalidatePath: () => {},
}));

import { createPurchaseOrder } from "../purchase-orders";

describe("RBAC Verification: Purchase Orders", () => {
  beforeEach(() => {
    selectCallCounter = 0;
    mockRole = "admin";
  });

  const orgId = "org-1";
  const poData = {
    projectId: "proj-1",
    poNumber: "PO-001",
    description: "Test PO",
    totalAmount: "1000",
    status: "open" as const,
  };

  it("VERIFICATION: Member should now be BLOCKED from creating Purchase Order", async () => {
    // Set permission to FALSE to simulate Member role (which has NO create access)
    permissionGranted = false;

    console.log("Simulating Member attempting to create PO...");
    const result = await createPurchaseOrder(orgId, poData);

    // Expect FAILURE
    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient permissions");
    console.log("SUCCESS: Member was blocked.");
  });

  it("VERIFICATION: Manager should be ALLOWED to create Purchase Order", async () => {
    mockRole = "manager";
    // Set permission to TRUE to simulate Manager role
    permissionGranted = true;
    selectCallCounter = 0; // Reset for db mocks

    console.log("Simulating Manager attempting to create PO...");
    const result = await createPurchaseOrder(orgId, poData);

    // Expect SUCCESS
    expect(result.success).toBe(true);
    console.log("SUCCESS: Manager was allowed.");
  });
});

it("blocks a member in the target organization even if the active organization grants permission", async () => {
  mockRole = "member";
  permissionGranted = true;
  const result = await createPurchaseOrder("other-org", {
    projectId: "proj-1",
    poNumber: "PO-002",
    description: "Test",
    totalAmount: "1000",
    status: "open",
  });
  expect(result.success).toBe(false);
  expect(result.error).toContain("Insufficient permissions");
});
