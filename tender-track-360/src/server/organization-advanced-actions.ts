'use server';

import { getCurrentUser } from './users';
import { getUserOrganizationMembership } from './organizations';
import {
  organizationDeletionManager,
  type DeletionConfirmation,
} from '@/lib/organization-deletion';
import {
  ownershipTransferManager,
  type OwnershipTransferRequest,
} from '@/lib/ownership-transfer';
import {
  bulkOperationsManager,
  type BulkMemberUpdate,
  type BulkInvitation,
} from '@/lib/bulk-operations';
// import { auditLogger } from '@/lib/audit-logger'; // TODO: Use for additional logging if needed
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

// Organization Deletion Actions
export async function initiateOrganizationDeletion(
  organizationId: string,
  confirmation: DeletionConfirmation
): Promise<
  ServerActionResult<{
    deletionId: string;
    exportUrl?: string;
    permanentDeletionScheduledAt?: Date;
  }>
> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to delete organization
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

    // Only owners can delete organizations
    if (userMembership.role !== 'owner') {
      return createServerActionError(
        'FORBIDDEN',
        'Only organization owners can delete organizations'
      );
    }

    // Validate the deletion request
    const validation =
      await organizationDeletionManager.validateDeletionRequest(
        organizationId,
        confirmation,
        userMembership.role
      );

    if (!validation.isValid) {
      return createServerActionError(
        'VALIDATION_ERROR',
        'Deletion validation failed',
        { errors: validation.errors, warnings: validation.warnings }
      );
    }

    // Execute soft deletion
    if (confirmation.deletionType === 'soft') {
      const result = await organizationDeletionManager.softDeleteOrganization(
        organizationId,
        currentUser.id,
        confirmation
      );

      if (!result.success) {
        return createServerActionError(
          'DELETION_FAILED',
          result.error || 'Failed to delete organization'
        );
      }

      // Revalidate organization pages and dashboard layout
      revalidatePath('/dashboard/settings/organization');
      revalidatePath(`/dashboard/settings/organization/${organizationId}`);
      revalidatePath('/dashboard'); // Revalidate dashboard to update sidebar

      return createServerActionSuccess({
        deletionId: result.deletionId!,
        exportUrl: result.exportUrl,
        permanentDeletionScheduledAt: result.permanentDeletionScheduledAt,
      });
    } else {
      // Permanent deletion
      const result =
        await organizationDeletionManager.permanentlyDeleteOrganization(
          organizationId,
          currentUser.id,
          confirmation.reason
        );

      if (!result.success) {
        return createServerActionError(
          'DELETION_FAILED',
          result.error || 'Failed to permanently delete organization'
        );
      }

      // Revalidate organization pages and dashboard layout
      revalidatePath('/dashboard/settings/organization');
      revalidatePath('/dashboard'); // Revalidate dashboard to update sidebar
      revalidatePath('/dashboard/settings'); // Revalidate settings layout

      return createServerActionSuccess({
        deletionId: result.deletionId || 'permanent',
      });
    }
  } catch (error) {
    console.error('Error initiating organization deletion:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to initiate organization deletion'
    );
  }
}

export async function restoreOrganization(
  organizationId: string,
  reason?: string
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Restore the organization
    const result = await organizationDeletionManager.restoreOrganization(
      organizationId,
      currentUser.id,
      reason
    );

    if (!result.success) {
      return createServerActionError(
        'RESTORATION_FAILED',
        result.error || 'Failed to restore organization'
      );
    }

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');
    revalidatePath(`/dashboard/settings/organization/${organizationId}`);

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error restoring organization:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to restore organization'
    );
  }
}

export async function forcePermanentDeletion(
  organizationId: string,
  reason: string
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to force permanent deletion
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

    // Force permanent deletion
    const result = await organizationDeletionManager.forcePermanentDeletion(
      organizationId,
      currentUser.id,
      userMembership.role,
      reason
    );

    if (!result.success) {
      return createServerActionError(
        'DELETION_FAILED',
        result.error || 'Failed to force permanent deletion'
      );
    }

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error forcing permanent deletion:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to force permanent deletion'
    );
  }
}

export async function getSoftDeletedOrganizations(): Promise<
  ServerActionResult<unknown[]>
> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    const softDeletedOrgs =
      await organizationDeletionManager.getSoftDeletedOrganizations(
        currentUser.id
      );

    return createServerActionSuccess(softDeletedOrgs);
  } catch (error) {
    console.error('Error getting soft deleted organizations:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to get soft deleted organizations'
    );
  }
}

// Ownership Transfer Actions
export async function initiateOwnershipTransfer(
  request: OwnershipTransferRequest
): Promise<ServerActionResult<{ transferId: string }>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to initiate transfer
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      request.organizationId
    );
    if (!userMembership) {
      return createServerActionError(
        'FORBIDDEN',
        'Access denied to this organization'
      );
    }

    // Only owners can initiate ownership transfer
    if (userMembership.role !== 'owner') {
      return createServerActionError(
        'FORBIDDEN',
        'Only organization owners can initiate ownership transfer'
      );
    }

    const result = await ownershipTransferManager.initiateOwnershipTransfer(
      request,
      currentUser.id
    );

    if (!result.success) {
      return createServerActionError(
        'TRANSFER_FAILED',
        result.error || 'Failed to initiate ownership transfer'
      );
    }

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');
    revalidatePath(
      `/dashboard/settings/organization/${request.organizationId}`
    );

    return createServerActionSuccess({
      transferId: result.transferId!,
    });
  } catch (error) {
    console.error('Error initiating ownership transfer:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to initiate ownership transfer'
    );
  }
}

export async function acceptOwnershipTransfer(
  transferId: string
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    const result = await ownershipTransferManager.acceptOwnershipTransfer(
      transferId,
      currentUser.id
    );

    if (!result.success) {
      return createServerActionError(
        'TRANSFER_FAILED',
        result.error || 'Failed to accept ownership transfer'
      );
    }

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error accepting ownership transfer:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to accept ownership transfer'
    );
  }
}

export async function cancelOwnershipTransfer(
  transferId: string
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    const result = await ownershipTransferManager.cancelOwnershipTransfer(
      transferId,
      currentUser.id
    );

    if (!result.success) {
      return createServerActionError(
        'TRANSFER_FAILED',
        result.error || 'Failed to cancel ownership transfer'
      );
    }

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error cancelling ownership transfer:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to cancel ownership transfer'
    );
  }
}

export async function acceptOwnershipTransferByToken(
  token: string
): Promise<ServerActionResult<void>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    const result = await ownershipTransferManager.acceptTransferByToken(
      token,
      currentUser.id
    );

    if (!result.success) {
      return createServerActionError(
        'TRANSFER_FAILED',
        result.error || 'Failed to accept ownership transfer'
      );
    }

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');

    return createServerActionSuccess(undefined);
  } catch (error) {
    console.error('Error accepting ownership transfer by token:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to accept ownership transfer'
    );
  }
}

export async function getPendingTransfers(): Promise<
  ServerActionResult<unknown[]>
> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    const pendingTransfers = await ownershipTransferManager.getPendingTransfers(
      currentUser.id
    );

    return createServerActionSuccess(pendingTransfers);
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to get pending transfers'
    );
  }
}

// Bulk Operations Actions
export async function bulkUpdateMemberRoles(
  organizationId: string,
  updates: BulkMemberUpdate[]
): Promise<ServerActionResult<unknown>> {
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

    const result = await bulkOperationsManager.bulkUpdateMemberRoles(
      organizationId,
      updates,
      currentUser.id,
      userMembership.role
    );

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');
    revalidatePath(`/dashboard/settings/organization/${organizationId}`);

    return createServerActionSuccess(result);
  } catch (error) {
    console.error('Error in bulk member role update:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to update member roles'
    );
  }
}

export async function bulkRemoveMembers(
  organizationId: string,
  memberIds: string[],
  reason?: string
): Promise<ServerActionResult<unknown>> {
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

    const result = await bulkOperationsManager.bulkRemoveMembers(
      organizationId,
      memberIds,
      currentUser.id,
      userMembership.role,
      reason
    );

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');
    revalidatePath(`/dashboard/settings/organization/${organizationId}`);

    return createServerActionSuccess(result);
  } catch (error) {
    console.error('Error in bulk member removal:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to remove members'
    );
  }
}

export async function bulkInviteMembers(
  organizationId: string,
  invitations: BulkInvitation[]
): Promise<ServerActionResult<unknown>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to invite members
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

    const result = await bulkOperationsManager.bulkInviteMembers(
      organizationId,
      invitations,
      currentUser.id,
      userMembership.role
    );

    // Revalidate organization pages
    revalidatePath('/dashboard/settings/organization');
    revalidatePath(`/dashboard/settings/organization/${organizationId}`);

    return createServerActionSuccess(result);
  } catch (error) {
    console.error('Error in bulk member invitations:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to invite members'
    );
  }
}

// Data Export Action
export async function exportOrganizationData(
  organizationId: string,
  format: 'json' | 'csv'
): Promise<ServerActionResult<{ exportUrl: string }>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return createServerActionError('UNAUTHORIZED', 'User not authenticated');
    }

    // Check if user has permission to export data
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

    // Only owners, admins, and managers can export data
    if (!['owner', 'admin', 'manager'].includes(userMembership.role)) {
      return createServerActionError(
        'FORBIDDEN',
        'Insufficient permissions to export organization data'
      );
    }

    const exportUrl = await organizationDeletionManager.exportOrganizationData(
      organizationId,
      format,
      currentUser.id
    );

    if (!exportUrl) {
      return createServerActionError(
        'EXPORT_FAILED',
        'Failed to export organization data'
      );
    }

    return createServerActionSuccess({ exportUrl });
  } catch (error) {
    console.error('Error exporting organization data:', error);
    return createServerActionError(
      'INTERNAL_ERROR',
      'Failed to export organization data'
    );
  }
}
