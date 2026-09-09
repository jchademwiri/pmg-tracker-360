"use server";
import { activeMemberWhere } from "@pmg/db/membership";

import { db } from "@pmg/db";
import { member, organization } from "@pmg/db/schema";
import type { Role } from "@pmg/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "./users";
import { requireOrgRole } from "./utils";
import { StorageService } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export interface ServerActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function createServerActionError(
  code: string,
  message: string,
  details?: unknown,
): ServerActionResult<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function createServerActionSuccess<T>(data: T): ServerActionResult<T> {
  return {
    success: true,
    data,
  };
}

// Update a member's role in an organization
export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  newRole: Role,
): Promise<ServerActionResult<void>> {
  try {
    if (!["admin", "manager", "member"].includes(newRole)) {
      return createServerActionError(
        "FORBIDDEN",
        "Ownership changes must use the ownership transfer workflow",
      );
    }

    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError("UNAUTHORIZED", "User not authenticated");
    }

    await requireOrgRole(organizationId, ["owner", "admin"]);

    // Get the target member to check their current role
    const targetMember = await db.query.member.findFirst({
      where: activeMemberWhere(
        and(eq(member.id, memberId), eq(member.organizationId, organizationId)),
      ),
    });

    if (!targetMember) {
      return createServerActionError("NOT_FOUND", "Member not found");
    }

    // Ownership may only be changed through the dedicated, transactional flow.
    if (targetMember.role === "owner") {
      return createServerActionError(
        "FORBIDDEN",
        "Ownership changes must use the ownership transfer workflow",
      );
    }

    // Prevent users from changing their own role
    if (targetMember.userId === currentUser.id) {
      return createServerActionError(
        "FORBIDDEN",
        "Cannot change your own role",
      );
    }

    // Update the member's role
    await db
      .update(member)
      .set({ role: newRole })
      .where(
        activeMemberWhere(
          eq(member.id, memberId),
          eq(member.organizationId, organizationId),
          eq(member.role, targetMember.role),
        ),
      );

    // Revalidate the organization page
    revalidatePath("/organization", "layout");

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error("Error updating member role:", error);
    return createServerActionError(
      "INTERNAL_ERROR",
      "Failed to update member role",
    );
  }
}

// Remove a member from an organization
export async function removeMemberFromOrganization(
  organizationId: string,
  memberId: string,
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError("UNAUTHORIZED", "User not authenticated");
    }

    const userMembership = await requireOrgRole(organizationId, [
      "owner",
      "admin",
      "manager",
    ]);

    // Get the target member to check their role
    const targetMember = await db.query.member.findFirst({
      where: activeMemberWhere(
        and(eq(member.id, memberId), eq(member.organizationId, organizationId)),
      ),
    });

    if (!targetMember) {
      return createServerActionError("NOT_FOUND", "Member not found");
    }

    // Prevent removing owner
    if (targetMember.role === "owner") {
      return createServerActionError(
        "FORBIDDEN",
        "Cannot remove organization owner",
      );
    }

    // Prevent users from removing themselves
    if (targetMember.userId === currentUser.id) {
      return createServerActionError(
        "FORBIDDEN",
        "Cannot remove yourself from the organization",
      );
    }

    // Managers can only remove members, not admins or other managers
    if (
      userMembership.role === "manager" &&
      ["admin", "manager"].includes(targetMember.role)
    ) {
      return createServerActionError(
        "FORBIDDEN",
        "Managers can only remove members",
      );
    }

    // Remove the member
    await db
      .update(member)
      .set({ deletedAt: new Date() })
      .where(
        activeMemberWhere(
          eq(member.id, memberId),
          eq(member.organizationId, organizationId),
          eq(member.role, targetMember.role),
        ),
      );

    // Revalidate the organization page
    revalidatePath("/organization", "layout");

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error("Error removing member:", error);
    return createServerActionError("INTERNAL_ERROR", "Failed to remove member");
  }
}

// Bulk remove members from an organization
export async function bulkRemoveMembersFromOrganization(
  organizationId: string,
  memberIds: string[],
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError("UNAUTHORIZED", "User not authenticated");
    }

    const userMembership = await requireOrgRole(organizationId, [
      "owner",
      "admin",
      "manager",
    ]);

    // Get all target members to validate permissions
    const targetMembers = await db.query.member.findMany({
      where: activeMemberWhere(
        and(
          eq(member.organizationId, organizationId),
          inArray(member.id, memberIds),
        ),
      ),
    });

    const validMemberIds: string[] = [];

    for (const memberId of memberIds) {
      const targetMember = targetMembers.find((m) => m.id === memberId);

      if (!targetMember) {
        continue; // Skip non-existent members
      }

      // Skip owner
      if (targetMember.role === "owner") {
        continue;
      }

      // Skip self
      if (targetMember.userId === currentUser.id) {
        continue;
      }

      // Managers can only remove members
      if (
        userMembership.role === "manager" &&
        ["admin", "manager"].includes(targetMember.role)
      ) {
        continue;
      }

      validMemberIds.push(memberId);
    }

    if (validMemberIds.length === 0) {
      return createServerActionError(
        "INVALID_REQUEST",
        "No valid members to remove",
      );
    }

    // Remove valid members
    await db
      .update(member)
      .set({ deletedAt: new Date() })
      .where(
        activeMemberWhere(
          eq(member.organizationId, organizationId),
          inArray(member.id, validMemberIds),
          inArray(
            member.role,
            userMembership.role === "manager"
              ? ["member"]
              : ["admin", "manager", "member"],
          ),
        ),
      );
    // Revalidate the organization page
    revalidatePath("/organization", "layout");

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error("Error bulk removing members:", error);
    return createServerActionError(
      "INTERNAL_ERROR",
      "Failed to remove members",
    );
  }
}

// Update organization details
export async function updateOrganizationDetails(
  organizationId: string,
  data: {
    name?: string;
    logo?: string;
    description?: string;
    website?: string;
    phone?: string;
    address?: string;
  },
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError("UNAUTHORIZED", "User not authenticated");
    }

    await requireOrgRole(organizationId, ["owner", "admin", "manager"]);

    // Prepare update data - only include fields that are provided
    const updateData: Partial<{
      name: string;
      logo: string;
      metadata: string;
    }> = {};
    if (data.name !== undefined) updateData.name = data.name;
    // Never persist a transient signed URL from our own storage (they expire
    // after 1h and are display-only representations of a storage key that is
    // already saved by the upload action). Only keys, external URLs, or an
    // empty string (remove) are stored.
    if (data.logo !== undefined && !StorageService.isOwnSignedUrl(data.logo)) {
      updateData.logo = data.logo;
    }

    // Handle metadata fields
    if (
      data.description !== undefined ||
      data.website !== undefined ||
      data.phone !== undefined ||
      data.address !== undefined
    ) {
      // Get current organization to preserve existing metadata
      const currentOrg = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
      });

      // Parse existing metadata
      let currentMetadata: Record<string, unknown> = {};
      try {
        if (currentOrg?.metadata) {
          if (typeof currentOrg.metadata === "string") {
            currentMetadata = JSON.parse(currentOrg.metadata);
          } else if (typeof currentOrg.metadata === "object") {
            currentMetadata = currentOrg.metadata as Record<string, unknown>;
          }
        }
      } catch (error) {
        console.warn("Failed to parse existing metadata:", error);
      }

      const newMetadata = {
        ...currentMetadata,
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
      };

      // Store metadata as JSON string
      updateData.metadata = JSON.stringify(newMetadata);
    }

    // Update the organization
    await db
      .update(organization)
      .set(updateData)
      .where(eq(organization.id, organizationId));

    // Revalidate the organization page
    revalidatePath("/organization", "layout");

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error("Error updating organization details:", error);
    return createServerActionError(
      "INTERNAL_ERROR",
      "Failed to update organization details",
    );
  }
}
// Update organization settings
export async function updateOrganizationSettings(
  organizationId: string,
  settings: {
    defaultMemberRole?: Role;
    allowMemberInvites?: boolean;
    requireApprovalForInvites?: boolean;
    emailNotifications?: boolean;
    slackNotifications?: boolean;
    timezone?: string;
    dateFormat?: string;
    language?: string;
  },
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError("UNAUTHORIZED", "User not authenticated");
    }

    await requireOrgRole(organizationId, ["owner", "admin"]);

    // Get current organization to preserve existing metadata
    const currentOrg = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!currentOrg) {
      return createServerActionError("NOT_FOUND", "Organization not found");
    }

    // Parse existing metadata
    let currentMetadata: Record<string, unknown> = {};
    try {
      if (currentOrg.metadata) {
        if (typeof currentOrg.metadata === "string") {
          currentMetadata = JSON.parse(currentOrg.metadata);
        } else if (typeof currentOrg.metadata === "object") {
          currentMetadata = currentOrg.metadata as Record<string, unknown>;
        }
      }
    } catch (error) {
      console.warn("Failed to parse existing metadata:", error);
    }

    // Update the settings within metadata
    const updatedMetadata = {
      ...currentMetadata,
      settings: {
        ...((currentMetadata.settings as Record<string, unknown>) || {}),
        ...settings,
      },
    };

    // Update the organization metadata with new settings
    await db
      .update(organization)
      .set({ metadata: JSON.stringify(updatedMetadata) })
      .where(eq(organization.id, organizationId));

    // Revalidate the organization page
    revalidatePath("/organization", "layout");

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return createServerActionError(
      "INTERNAL_ERROR",
      "Failed to update organization settings",
    );
  }
}
