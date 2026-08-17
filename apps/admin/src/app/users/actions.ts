"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@pmg/db";
import {
  user,
  session as sessionTable,
  member,
  organization,
  account,
} from "@pmg/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UserDetail = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  plan: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastActiveOrganizationId: string | null;
  sessions: Array<{
    id: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
  memberships: Array<{
    orgId: string;
    orgName: string;
    role: string;
  }>;
  providerId: string | null;
};

/**
 * Fetches user detailed profile, active sessions, and organization memberships.
 */
export async function getUserDetail(userId: string): Promise<UserDetail> {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    throw new Error("Unauthorized");
  }

  const [foundUser] = await db.select().from(user).where(eq(user.id, userId));

  if (!foundUser) {
    throw new Error("User not found");
  }

  const sessions = await db
    .select({
      id: sessionTable.id,
      expiresAt: sessionTable.expiresAt,
      ipAddress: sessionTable.ipAddress,
      userAgent: sessionTable.userAgent,
      createdAt: sessionTable.createdAt,
    })
    .from(sessionTable)
    .where(eq(sessionTable.userId, userId));

  const memberships = await db
    .select({
      orgId: member.organizationId,
      orgName: organization.name,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));

  const [acct] = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId));

  return {
    ...foundUser,
    sessions,
    memberships,
    providerId: acct?.providerId ?? null,
  };
}

/**
 * Updates a user's system role (user <-> admin).
 */
export async function updateUserRole(
  userId: string,
  newRole: "user" | "admin",
) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  // Prevent demoting self
  if (currentSession.user.id === userId && newRole !== "admin") {
    return {
      success: false,
      error: "You cannot remove admin privileges from your own account.",
    };
  }

  // If demoting to user, ensure at least one other admin remains
  if (newRole !== "admin") {
    const adminCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"));
    const adminCount = adminCountResult[0]?.count ?? 0;
    if (adminCount <= 1) {
      return {
        success: false,
        error: "Cannot demote the sole system administrator.",
      };
    }
  }

  try {
    await db.update(user).set({ role: newRole }).where(eq(user.id, userId));

    revalidatePath("/users");
    return { success: true, message: `User role updated to ${newRole}.` };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      error: e.message || "Failed to update user role.",
    };
  }
}

/**
 * Updates a user's plan (free <-> starter <-> pro).
 */
export async function updateUserPlan(
  userId: string,
  newPlan: "free" | "starter" | "pro",
) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.update(user).set({ plan: newPlan }).where(eq(user.id, userId));

    revalidatePath("/users");
    return { success: true, message: `User plan updated to ${newPlan}.` };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      error: e.message || "Failed to update user plan.",
    };
  }
}

/**
 * Suspends or unsuspends a user account by revoking all active sessions.
 */
export async function toggleUserSuspension(
  userId: string,
  suspend: boolean,
  reason?: string,
) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (currentSession.user.id === userId) {
    return { success: false, error: "You cannot suspend your own account." };
  }

  try {
    if (suspend) {
      // Revoke all active sessions for the target user
      await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
    }

    revalidatePath("/users");
    return {
      success: true,
      message: suspend
        ? "User sessions revoked and account suspended."
        : "User account restored.",
    };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      error: e.message || "Failed to change suspension state.",
    };
  }
}

/**
 * Deletes a user account permanently from the system.
 */
export async function deleteUserAccount(userId: string) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (currentSession.user.id === userId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  // Ensure target user is not the sole system admin
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (targetUser?.role === "admin") {
    const adminCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"));
    const adminCount = adminCountResult[0]?.count ?? 0;
    if (adminCount <= 1) {
      return {
        success: false,
        error: "Cannot delete the sole system administrator account.",
      };
    }
  }

  try {
    await db.delete(user).where(eq(user.id, userId));
    revalidatePath("/users");
    return { success: true, message: "User account permanently deleted." };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      error: e.message || "Failed to delete user account.",
    };
  }
}

/**
 * Bulk updates role for multiple users.
 */
export async function bulkUpdateUserRole(
  userIds: string[],
  newRole: "user" | "admin",
) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  if (!userIds || userIds.length === 0) {
    return { success: false, error: "No users selected." };
  }

  // Exclude current user from self-demotion
  const filteredIds = userIds.filter(
    (id) => !(id === currentSession.user.id && newRole !== "admin"),
  );

  if (filteredIds.length === 0) {
    return { success: false, error: "Cannot demote your own account." };
  }

  try {
    await db
      .update(user)
      .set({ role: newRole })
      .where(inArray(user.id, filteredIds));

    revalidatePath("/users");
    return {
      success: true,
      message: `Updated role for ${filteredIds.length} user(s).`,
    };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || "Failed bulk role update." };
  }
}

/**
 * Bulk updates user plan (free, starter, or pro).
 */
export async function bulkUpdateUserPlan(
  userIds: string[],
  newPlan: "free" | "starter" | "pro",
) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  if (!userIds || userIds.length === 0) {
    return { success: false, error: "No users selected." };
  }

  try {
    await db
      .update(user)
      .set({ plan: newPlan })
      .where(inArray(user.id, userIds));

    revalidatePath("/users");
    return {
      success: true,
      message: `Updated plan for ${userIds.length} user(s).`,
    };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || "Failed bulk plan update." };
  }
}

/**
 * Bulk revokes sessions & suspends multiple users.
 */
export async function bulkToggleUserSuspension(
  userIds: string[],
  suspend: boolean,
) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const safeIds = userIds.filter((id) => id !== currentSession.user.id);
  if (safeIds.length === 0) {
    return { success: false, error: "Cannot suspend your own account." };
  }

  try {
    if (suspend) {
      await db
        .delete(sessionTable)
        .where(inArray(sessionTable.userId, safeIds));
    }
    revalidatePath("/users");
    return {
      success: true,
      message: `${suspend ? "Suspended" : "Restored"} ${safeIds.length} user account(s).`,
    };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || "Failed bulk suspension." };
  }
}

/**
 * Bulk deletes multiple user accounts safely.
 */
export async function bulkDeleteUserAccounts(userIds: string[]) {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!currentSession || (currentSession.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const safeIds = userIds.filter((id) => id !== currentSession.user.id);
  if (safeIds.length === 0) {
    return { success: false, error: "Cannot delete your own account." };
  }

  try {
    await db.delete(user).where(inArray(user.id, safeIds));
    revalidatePath("/users");
    return {
      success: true,
      message: `Permanently deleted ${safeIds.length} user account(s).`,
    };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || "Failed bulk user deletion." };
  }
}
