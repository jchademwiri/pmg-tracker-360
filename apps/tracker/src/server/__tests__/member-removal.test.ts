/** @jest-environment node */
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

const mockGuard = jest.fn();
const mockFindFirst = jest.fn();
const mockFindMany = jest.fn();
const mockReturning = jest.fn();
const mockWhere = jest.fn((_condition: SQL) => ({ returning: mockReturning }));
const mockSet = jest.fn(() => ({ where: mockWhere }));
const mockUpdate = jest.fn(() => ({ set: mockSet }));
const mockAddMember = jest.fn();

jest.mock("@pmg/db", () => ({
  db: {
    query: {
      member: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      user: { findFirst: jest.fn() },
      organization: { findFirst: jest.fn() },
    },
    update: () => mockUpdate(),
  },
}));
jest.mock("../utils", () => ({
  requireOrgRole: (...args: unknown[]) => mockGuard(...args),
}));
jest.mock("../users", () => ({
  getCurrentUser: async () => ({ currentUser: { id: "actor" } }),
}));
jest.mock("../organizations", () => ({
  getUserOrganizationMembership: async () => ({ role: "admin" }),
}));
jest.mock("@/lib/auth", () => ({
  auth: { api: { addMember: (...args: unknown[]) => mockAddMember(...args) } },
}));
jest.mock("@/lib/storage", () => ({ StorageService: {} }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("resend", () => ({ Resend: jest.fn() }));
jest.mock("@/emails/organization-invitation", () => ({}));
jest.mock("@/lib/audit-logger", () => ({
  auditLogger: { logBulkMemberOperation: jest.fn() },
}));

import {
  removeMemberFromOrganization,
  bulkRemoveMembersFromOrganization,
  updateMemberRole,
} from "../organization-members";
import { removeMember, addMember } from "../members";
import { bulkRemoveMembers } from "../invitations";
import { bulkOperationsManager } from "@/lib/bulk-operations";

const target = {
  id: "target",
  userId: "user-2",
  organizationId: "org-2",
  role: "member",
};
const sql = (condition: SQL) => new PgDialect().sqlToQuery(condition);

beforeEach(() => {
  jest.clearAllMocks();
  mockGuard.mockResolvedValue({ role: "admin", userId: "actor" });
  mockFindFirst.mockResolvedValue(target);
  mockFindMany.mockResolvedValue([target]);
  mockReturning.mockResolvedValue([{ id: target.id }]);
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it("legacy removal authorizes the target organization and soft-deletes only that active membership", async () => {
  expect((await removeMember("target")).success).toBe(true);
  expect(mockGuard).toHaveBeenCalledWith("org-2", [
    "owner",
    "admin",
    "manager",
  ]);
  expect(mockSet).toHaveBeenCalledWith({ deletedAt: expect.any(Date) });
  const condition = sql(mockWhere.mock.calls[0][0]);
  expect(condition.params).toEqual(["target", "org-2", "member"]);
  expect(condition.sql).toContain('"member"."deleted_at" is null');
  expect(condition.sql).toContain('"user"."deleted_at" is null');
});

it("does not mutate when the shared guard rejects access to the target organization", async () => {
  mockGuard.mockRejectedValue(new Error("Access denied"));
  expect((await removeMember("target")).success).toBe(false);
  expect(mockUpdate).not.toHaveBeenCalled();
});

it.each(["owner", "admin", "manager"])(
  "a manager cannot remove a %s",
  async (role) => {
    mockGuard.mockResolvedValue({ role: "manager" });
    mockFindFirst.mockResolvedValue({ ...target, role });
    expect(
      (await removeMemberFromOrganization("org-2", "target")).success,
    ).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  },
);

it("rejects self-removal and missing/deleted targets", async () => {
  mockFindFirst.mockResolvedValue({ ...target, userId: "actor" });
  expect((await removeMemberFromOrganization("org-2", "target")).success).toBe(
    false,
  );
  mockFindFirst.mockResolvedValue(undefined);
  expect(
    (await removeMemberFromOrganization("org-2", "target")).error?.code,
  ).toBe("NOT_FOUND");
  expect(mockUpdate).not.toHaveBeenCalled();
});

it("bulk removal performs one update containing only eligible targets", async () => {
  mockGuard.mockResolvedValue({ role: "manager" });
  mockFindMany.mockResolvedValue([
    target,
    { ...target, id: "owner", role: "owner" },
    { ...target, id: "self", userId: "actor" },
  ]);
  expect(
    (
      await bulkRemoveMembersFromOrganization("org-2", [
        "target",
        "owner",
        "self",
        "missing",
      ])
    ).success,
  ).toBe(true);
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(sql(mockWhere.mock.calls[0][0]).params).toEqual([
    "org-2",
    "target",
    "member",
  ]);
});

it("cross-organization bulk removal protects owners and writes only validated IDs", async () => {
  mockFindMany.mockResolvedValue([{ ...target, role: "owner" }]);
  expect((await bulkRemoveMembers(["target"])).success).toBe(false);
  expect(mockUpdate).not.toHaveBeenCalled();
  mockFindMany.mockResolvedValue([target]);
  expect(
    (await bulkRemoveMembers(["target", "deleted-or-foreign"])).success,
  ).toBe(true);
  expect(sql(mockWhere.mock.calls[0][0]).params).toEqual([
    "target",
    "admin",
    "manager",
    "member",
  ]);
});

it("rejects ownership changes through ordinary add and role-update actions", async () => {
  expect((await addMember("org-2", "user-2", "owner")).success).toBe(false);
  expect((await updateMemberRole("org-2", "target", "owner")).success).toBe(
    false,
  );
  expect(mockAddMember).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});

it("also rejects ownership assignment through the advanced bulk workflow", async () => {
  const result = await bulkOperationsManager.bulkUpdateMemberRoles(
    "org-2",
    [{ memberId: "target", newRole: "owner" }],
    "actor",
    "owner",
  );
  expect(result.success).toBe(false);
  expect(result.errors[0].error).toContain("ownership transfer workflow");
  expect(mockUpdate).not.toHaveBeenCalled();
});
