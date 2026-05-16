'use server';

import { db } from '@/db';
import { member, organization } from '@/db/schema';
import type { Role } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from './users';
import { getUserOrganizationMembership } from './organizations';
import { revalidatePath } from 'next/cache';

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
  details?: unknown
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
  newRole: Role
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to update member roles
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );
    if (!userMembership) {
      return createServerActionError(
        'FORBIDDEN',
        'Access denied to this organization'
      );
    }

    // Only owners and admins can change roles
    if (!['owner', 'admin'].includes(userMembership.role)) {
      return createServerActionError(
        'FORBIDDEN',
        'Insufficient permissions to change member roles'
      );
    }

    // Get the target member to check their current role
    const targetMember = await db.query.member.findFirst({
      where: and(
        eq(member.id, memberId),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!targetMember) {
      return createServerActionError('NOT_FOUND', 'Member not found');
    }

    // Prevent changing owner role unless current user is owner
    if (targetMember.role === 'owner' && userMembership.role !== 'owner') {
      return createServerActionError(
        'FORBIDDEN',
        'Only owners can change owner roles'
      );
    }

    // Prevent non-owners from assigning owner role
    if (newRole === 'owner' && userMembership.role !== 'owner') {
      return createServerActionError(
        'FORBIDDEN',
        'Only owners can assign owner role'
      );
    }

    // Prevent users from changing their own role
    if (targetMember.userId === currentUser.id) {
      return createServerActionError(
        'FORBIDDEN',
        'Cannot change your own role'
      );
    }

    // Update the member's role
    await db
      .update(member)
      .set({ role: newRole })
      .where(eq(member.id, memberId));

    // Revalidate the organization page
    revalidatePath(`/dashboard/settings/organization`);

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error updating member role:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to update member role'
    );
  }
}

// Remove a member from an organization
export async function removeMemberFromOrganization(
  organizationId: string,
  memberId: string
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to remove members
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );
    if (!userMembership) {
      return createServerActionError(
        'FORBIDDEN',
        'Access denied to this organization'
      );
    }

    // Only owners, admins, and managers can remove members
    if (!['owner', 'admin', 'manager'].includes(userMembership.role)) {
      return createServerActionError(
        'FORBIDDEN',
        'Insufficient permissions to remove members'
      );
    }

    // Get the target member to check their role
    const targetMember = await db.query.member.findFirst({
      where: and(
        eq(member.id, memberId),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!targetMember) {
      return createServerActionError('NOT_FOUND', 'Member not found');
    }

    // Prevent removing owner
    if (targetMember.role === 'owner') {
      return createServerActionError(
        'FORBIDDEN',
        'Cannot remove organization owner'
      );
    }

    // Prevent users from removing themselves
    if (targetMember.userId === currentUser.id) {
      return createServerActionError(
        'FORBIDDEN',
        'Cannot remove yourself from the organization'
      );
    }

    // Managers can only remove members, not admins or other managers
    if (
      userMembership.role === 'manager' &&
      ['admin', 'manager'].includes(targetMember.role)
    ) {
      return createServerActionError(
        'FORBIDDEN',
        'Managers can only remove members'
      );
    }

    // Remove the member
    await db.delete(member).where(eq(member.id, memberId));

    // Revalidate the organization page
    revalidatePath(`/dashboard/settings/organization`);

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error removing member:', error);
    return createServerActionError('INTERNAL_ERROR', 'Failed to remove member');
  }
}

// Bulk remove members from an organization
export async function bulkRemoveMembersFromOrganization(
  organizationId: string,
  memberIds: string[]
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to remove members
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );
    if (!userMembership) {
      return createServerActionError(
        'FORBIDDEN',
        'Access denied to this organization'
      );
    }

    // Only owners, admins, and managers can remove members
    if (!['owner', 'admin', 'manager'].includes(userMembership.role)) {
      return createServerActionError(
        'FORBIDDEN',
        'Insufficient permissions to remove members'
      );
    }

    // Get all target members to validate permissions
    const targetMembers = await db.query.member.findMany({
      where: and(
        eq(member.organizationId, organizationId)
        // Note: We'd need to use inArray here, but let's validate each member individually
      ),
    });

    const validMemberIds: string[] = [];

    for (const memberId of memberIds) {
      const targetMember = targetMembers.find((m) => m.id === memberId);

      if (!targetMember) {
        continue; // Skip non-existent members
      }

      // Skip owner
      if (targetMember.role === 'owner') {
        continue;
      }

      // Skip self
      if (targetMember.userId === currentUser.id) {
        continue;
      }

      // Managers can only remove members
      if (
        userMembership.role === 'manager' &&
        ['admin', 'manager'].includes(targetMember.role)
      ) {
        continue;
      }

      validMemberIds.push(memberId);
    }

    if (validMemberIds.length === 0) {
      return createServerActionError(
        'INVALID_REQUEST',
        'No valid members to remove'
      );
    }

    // Remove valid members
    for (const memberId of validMemberIds) {
      await db.delete(member).where(eq(member.id, memberId));
    }
// Revalidate the organization page
revalidatePath(`/dashboard/settings/organization`);


    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error bulk removing members:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to remove members'
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
  }
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to update organization details
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );
    if (!userMembership) {
      return createServerActionError(
        'FORBIDDEN',
        'Access denied to this organization'
      );
    }

    // Only owners, admins, and managers can update organization details
    if (!['owner', 'admin', 'manager'].includes(userMembership.role)) {
      return createServerActionError(
        'FORBIDDEN',
        'Insufficient permissions to update organization details'
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<{
      name: string;
      logo: string;
      metadata: string;
    }> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logo !== undefined) updateData.logo = data.logo;

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

      // Parse existing metadata (it's stored as JSON string)
      let currentMetadata: Record<string, unknown> = {};
      try {
        if (currentOrg?.metadata) {
          currentMetadata = JSON.parse(currentOrg.metadata);
        }
      } catch (error) {
        console.warn('Failed to parse existing metadata:', error);
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
    revalidatePath(`/dashboard/settings/organization`);

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error updating organization details:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to update organization details'
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
  }
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to update organization settings
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );
    if (!userMembership) {
      return createServerActionError(
        'FORBIDDEN',
        'Access denied to this organization'
      );
    }

    // Only owners and admins can update organization settings
    if (!['owner', 'admin'].includes(userMembership.role)) {
      return createServerActionError(
        'FORBIDDEN',
        'Insufficient permissions to update organization settings'
      );
    }

    // Get current organization to preserve existing metadata
    const currentOrg = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!currentOrg) {
      return createServerActionError('NOT_FOUND', 'Organization not found');
    }

    // Parse existing metadata (it's stored as JSON string)
    let currentMetadata: Record<string, unknown> = {};
    try {
      if (currentOrg.metadata) {
        currentMetadata = JSON.parse(currentOrg.metadata);
      }
    } catch (error) {
      console.warn('Failed to parse existing metadata:', error);
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
    revalidatePath(`/dashboard/settings/organization`);

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to update organization settings'
    );
  }
}
