"use server";

import { db } from "@pmg/db";
import { member, user, type Role } from "@pmg/db/schema";
import { activeMemberWhere } from "@pmg/db/membership";
import { auth } from "@/lib/auth";
import { and, eq, isNull } from "drizzle-orm";
import { requireOrgRole } from "./utils";
import { removeMemberFromOrganization } from "./organization-members";

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role,
) => {
  try {
    await requireOrgRole(organizationId, ["owner", "admin"]);
    if (!["admin", "manager", "member"].includes(role)) {
      throw new Error(
        "Ownership changes must use the ownership transfer workflow",
      );
    }
    const targetUser = await db.query.user.findFirst({
      where: and(eq(user.id, userId), isNull(user.deletedAt)),
    });
    if (!targetUser) throw new Error("User not found");
    await auth.api.addMember({ body: { userId, organizationId, role } });
    return { success: true, message: "Member added successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to add member",
    };
  }
};

export const removeMember = async (memberId: string) => {
  try {
    const target = await db.query.member.findFirst({
      where: activeMemberWhere(eq(member.id, memberId)),
    });
    if (!target) throw new Error("Member not found");
    const result = await removeMemberFromOrganization(
      target.organizationId,
      memberId,
    );
    const error = result.error?.message ?? null;
    return {
      success: result.success,
      message: error ?? "Member removed successfully",
      error,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove member";
    return { success: false, message, error: message };
  }
};
