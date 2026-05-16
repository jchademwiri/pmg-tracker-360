import { db } from '@/db';
import { member, invitation } from '@/db/schema';
import type { Role } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auditLogger } from './audit-logger';

export interface BulkMemberUpdate {
  memberId: string;
  newRole: Role;
  reason?: string;
}

export interface BulkInvitation {
  email: string;
  role: Role;
  message?: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  rollbackToken?: string;
}

export interface BulkOperationProgress {
  total: number;
  processed: number;
  failed: number;
  currentOperation?: string;
  isComplete: boolean;
}

class BulkOperationsManager {
  private progressTrackers = new Map<string, BulkOperationProgress>();

  async bulkUpdateMemberRoles(
    organizationId: string,
    updates: BulkMemberUpdate[],
    performingUserId: string,
    performingUserRole: Role
  ): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Initialize progress tracking
    this.progressTrackers.set(operationId, {
      total: updates.length,
      processed: 0,
      failed: 0,
      isComplete: false,
    });

    try {
      // Validate permissions
      if (!['owner', 'admin'].includes(performingUserRole)) {
        return {
          success: false,
          processed: 0,
          failed: updates.length,
          errors: [
            {
              id: 'permission',
              error: 'Insufficient permissions for bulk role updates',
            },
          ],
        };
      }

      // Get all members to validate
      const memberIds = updates.map((u) => u.memberId);
      const members = await db.query.member.findMany({
        where: and(
          eq(member.organizationId, organizationId),
          inArray(member.id, memberIds)
        ),
        with: {
          user: true,
        },
      });

      const memberMap = new Map(members.map((m) => [m.id, m]));
      const rollbackData: Array<{ memberId: string; originalRole: Role }> = [];

      // Process each update
      for (const update of updates) {
        this.updateProgress(
          operationId,
          `Updating role for member ${update.memberId}`
        );

        try {
          const targetMember = memberMap.get(update.memberId);

          if (!targetMember) {
            result.errors.push({
              id: update.memberId,
              error: 'Member not found',
            });
            result.failed++;
            continue;
          }

          // Validate role change permissions
          const validationError = this.validateRoleChange(
            performingUserRole,
            targetMember.role,
            update.newRole,
            targetMember.userId === performingUserId
          );

          if (validationError) {
            result.errors.push({
              id: update.memberId,
              error: validationError,
            });
            result.failed++;
            continue;
          }

          // Store original role for rollback
          rollbackData.push({
            memberId: update.memberId,
            originalRole: targetMember.role,
          });

          // Update the member role
          await db
            .update(member)
            .set({ role: update.newRole })
            .where(eq(member.id, update.memberId));

          // Log the individual role change
          await auditLogger.logMemberRoleUpdated(
            organizationId,
            performingUserId,
            update.memberId,
            {
              previousRole: targetMember.role,
              newRole: update.newRole,
              reason: update.reason,
              bulkOperation: true,
              targetUserName: targetMember.user.name,
              targetUserEmail: targetMember.user.email,
            }
          );

          result.processed++;
        } catch (error) {
          console.error(`Error updating member ${update.memberId}:`, error);
          result.errors.push({
            id: update.memberId,
            error: 'Failed to update member role',
          });
          result.failed++;
        }

        // Update progress
        const progress = this.progressTrackers.get(operationId);
        if (progress) {
          progress.processed = result.processed;
          progress.failed = result.failed;
        }
      }

      // Store rollback data if there were any successful updates
      if (rollbackData.length > 0) {
        result.rollbackToken = await this.storeRollbackData(
          operationId,
          rollbackData
        );
      }

      // Log the bulk operation
      await auditLogger.logBulkMemberOperation(
        organizationId,
        performingUserId,
        {
          operation: 'bulk_role_update',
          totalUpdates: updates.length,
          successful: result.processed,
          failed: result.failed,
          errors: result.errors,
        }
      );

      // Mark operation as complete
      const progress = this.progressTrackers.get(operationId);
      if (progress) {
        progress.isComplete = true;
        progress.currentOperation = 'Complete';
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      console.error('Error in bulk member role update:', error);
      return {
        success: false,
        processed: result.processed,
        failed: updates.length - result.processed,
        errors: [{ id: 'system', error: 'Bulk operation failed' }],
      };
    }
  }

  async bulkRemoveMembers(
    organizationId: string,
    memberIds: string[],
    performingUserId: string,
    performingUserRole: Role,
    reason?: string
  ): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Initialize progress tracking
    this.progressTrackers.set(operationId, {
      total: memberIds.length,
      processed: 0,
      failed: 0,
      isComplete: false,
    });

    try {
      // Validate permissions
      if (!['owner', 'admin', 'manager'].includes(performingUserRole)) {
        return {
          success: false,
          processed: 0,
          failed: memberIds.length,
          errors: [
            {
              id: 'permission',
              error: 'Insufficient permissions for bulk member removal',
            },
          ],
        };
      }

      // Get all members to validate
      const members = await db.query.member.findMany({
        where: and(
          eq(member.organizationId, organizationId),
          inArray(member.id, memberIds)
        ),
        with: {
          user: true,
        },
      });

      const memberMap = new Map(members.map((m) => [m.id, m]));
      const rollbackData: Array<{ memberId: string; memberData: unknown }> = [];

      // Process each removal
      for (const memberId of memberIds) {
        this.updateProgress(operationId, `Removing member ${memberId}`);

        try {
          const targetMember = memberMap.get(memberId);

          if (!targetMember) {
            result.errors.push({
              id: memberId,
              error: 'Member not found',
            });
            result.failed++;
            continue;
          }

          // Validate removal permissions
          const validationError = this.validateMemberRemoval(
            performingUserRole,
            targetMember.role,
            targetMember.userId === performingUserId
          );

          if (validationError) {
            result.errors.push({
              id: memberId,
              error: validationError,
            });
            result.failed++;
            continue;
          }

          // Store member data for rollback
          rollbackData.push({
            memberId,
            memberData: targetMember,
          });

          // Remove the member
          await db.delete(member).where(eq(member.id, memberId));

          // Log the individual member removal
          await auditLogger.logMemberRemoved(
            organizationId,
            performingUserId,
            memberId,
            {
              removedUserName: targetMember.user.name,
              removedUserEmail: targetMember.user.email,
              removedUserRole: targetMember.role,
              reason,
              bulkOperation: true,
            }
          );

          result.processed++;
        } catch (error) {
          console.error(`Error removing member ${memberId}:`, error);
          result.errors.push({
            id: memberId,
            error: 'Failed to remove member',
          });
          result.failed++;
        }

        // Update progress
        const progress = this.progressTrackers.get(operationId);
        if (progress) {
          progress.processed = result.processed;
          progress.failed = result.failed;
        }
      }

      // Store rollback data if there were any successful removals
      if (rollbackData.length > 0) {
        result.rollbackToken = await this.storeRollbackData(
          operationId,
          rollbackData
        );
      }

      // Log the bulk operation
      await auditLogger.logBulkMemberOperation(
        organizationId,
        performingUserId,
        {
          operation: 'bulk_member_removal',
          totalRemovals: memberIds.length,
          successful: result.processed,
          failed: result.failed,
          reason,
          errors: result.errors,
        }
      );

      // Mark operation as complete
      const progress = this.progressTrackers.get(operationId);
      if (progress) {
        progress.isComplete = true;
        progress.currentOperation = 'Complete';
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      console.error('Error in bulk member removal:', error);
      return {
        success: false,
        processed: result.processed,
        failed: memberIds.length - result.processed,
        errors: [{ id: 'system', error: 'Bulk removal operation failed' }],
      };
    }
  }

  async bulkInviteMembers(
    organizationId: string,
    invitations: BulkInvitation[],
    performingUserId: string,
    performingUserRole: Role
  ): Promise<BulkOperationResult> {
    const operationId = crypto.randomUUID();
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    // Initialize progress tracking
    this.progressTrackers.set(operationId, {
      total: invitations.length,
      processed: 0,
      failed: 0,
      isComplete: false,
    });

    try {
      // Validate permissions
      if (!['owner', 'admin', 'manager'].includes(performingUserRole)) {
        return {
          success: false,
          processed: 0,
          failed: invitations.length,
          errors: [
            {
              id: 'permission',
              error: 'Insufficient permissions for bulk invitations',
            },
          ],
        };
      }

      // Get existing invitations and members to avoid duplicates
      const existingInvitations = await db.query.invitation.findMany({
        where: eq(invitation.organizationId, organizationId),
      });

      const existingMembers = await db.query.member.findMany({
        where: eq(member.organizationId, organizationId),
        with: {
          user: true,
        },
      });

      const existingEmails = new Set([
        ...existingInvitations.map((inv) => inv.email.toLowerCase()),
        ...existingMembers.map((mem) => mem.user.email.toLowerCase()),
      ]);

      // Process each invitation
      for (const invite of invitations) {
        this.updateProgress(
          operationId,
          `Sending invitation to ${invite.email}`
        );

        try {
          // Validate email format
          if (!this.isValidEmail(invite.email)) {
            result.errors.push({
              id: invite.email,
              error: 'Invalid email format',
            });
            result.failed++;
            continue;
          }

          // Check for duplicates
          if (existingEmails.has(invite.email.toLowerCase())) {
            result.errors.push({
              id: invite.email,
              error: 'User already invited or is a member',
            });
            result.failed++;
            continue;
          }

          // Validate role assignment permissions
          const roleValidationError = this.validateRoleAssignment(
            performingUserRole,
            invite.role
          );
          if (roleValidationError) {
            result.errors.push({
              id: invite.email,
              error: roleValidationError,
            });
            result.failed++;
            continue;
          }

          // Create the invitation
          const invitationId = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          await db.insert(invitation).values({
            id: invitationId,
            organizationId,
            email: invite.email,
            role: invite.role,
            status: 'pending',
            expiresAt,
            inviterId: performingUserId,
          });

          // Add to existing emails to prevent duplicates in this batch
          existingEmails.add(invite.email.toLowerCase());

          // Send invitation email (in production, integrate with email service)
          await this.sendInvitationEmail(invitationId, invite);

          // Log the invitation
          await auditLogger.log({
            organizationId,
            userId: performingUserId,
            action: 'member_removed', // Using existing action, in production add 'member_invited'
            resourceType: 'invitation',
            resourceId: invitationId,
            details: {
              invitedEmail: invite.email,
              role: invite.role,
              message: invite.message,
              bulkOperation: true,
            },
            severity: 'info',
          });

          result.processed++;
        } catch (error) {
          console.error(`Error inviting ${invite.email}:`, error);
          result.errors.push({
            id: invite.email,
            error: 'Failed to send invitation',
          });
          result.failed++;
        }

        // Update progress
        const progress = this.progressTrackers.get(operationId);
        if (progress) {
          progress.processed = result.processed;
          progress.failed = result.failed;
        }
      }

      // Log the bulk operation
      await auditLogger.logBulkMemberOperation(
        organizationId,
        performingUserId,
        {
          operation: 'bulk_invitations',
          totalInvitations: invitations.length,
          successful: result.processed,
          failed: result.failed,
          errors: result.errors,
        }
      );

      // Mark operation as complete
      const progress = this.progressTrackers.get(operationId);
      if (progress) {
        progress.isComplete = true;
        progress.currentOperation = 'Complete';
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      console.error('Error in bulk invitations:', error);
      return {
        success: false,
        processed: result.processed,
        failed: invitations.length - result.processed,
        errors: [{ id: 'system', error: 'Bulk invitation operation failed' }],
      };
    }
  }

  private validateRoleChange(
    performingUserRole: Role,
    currentRole: Role,
    newRole: Role,
    isSelfUpdate: boolean
  ): string | null {
    // Cannot change own role
    if (isSelfUpdate) {
      return 'Cannot change your own role';
    }

    // Cannot change owner role unless performer is owner
    if (currentRole === 'owner' && performingUserRole !== 'owner') {
      return 'Only owners can change owner roles';
    }

    // Cannot assign owner role unless performer is owner
    if (newRole === 'owner' && performingUserRole !== 'owner') {
      return 'Only owners can assign owner role';
    }

    // Admins cannot change other admin or manager roles
    if (
      performingUserRole === 'admin' &&
      ['admin', 'manager'].includes(currentRole)
    ) {
      return 'Admins cannot change admin or manager roles';
    }

    return null;
  }

  private validateMemberRemoval(
    performingUserRole: Role,
    targetRole: Role,
    isSelfRemoval: boolean
  ): string | null {
    // Cannot remove self
    if (isSelfRemoval) {
      return 'Cannot remove yourself from the organization';
    }

    // Cannot remove owner
    if (targetRole === 'owner') {
      return 'Cannot remove organization owner';
    }

    // Managers can only remove members
    if (
      performingUserRole === 'manager' &&
      ['admin', 'manager'].includes(targetRole)
    ) {
      return 'Managers can only remove members';
    }

    return null;
  }

  private validateRoleAssignment(
    performingUserRole: Role,
    assignedRole: Role
  ): string | null {
    // Only owners can assign owner role
    if (assignedRole === 'owner' && performingUserRole !== 'owner') {
      return 'Only owners can assign owner role';
    }

    // Managers cannot assign admin or manager roles
    if (
      performingUserRole === 'manager' &&
      ['admin', 'manager'].includes(assignedRole)
    ) {
      return 'Managers cannot assign admin or manager roles';
    }

    return null;
  }

  private updateProgress(operationId: string, currentOperation: string): void {
    const progress = this.progressTrackers.get(operationId);
    if (progress) {
      progress.currentOperation = currentOperation;
    }
  }

  private async storeRollbackData(
    operationId: string,
    rollbackData: unknown[]
  ): Promise<string> {
    // In a real implementation, store rollback data in a secure location
    // For now, we'll just return a token
    const rollbackToken = crypto.randomUUID();

    // Store rollback data (in production, use Redis or database)
    console.log(
      `Storing rollback data for operation ${operationId}:`,
      rollbackData
    );

    return rollbackToken;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async sendInvitationEmail(
    invitationId: string,
    invite: BulkInvitation
  ): Promise<void> {
    // In a real implementation, integrate with your email service
    console.log('Sending invitation email:', {
      invitationId,
      to: invite.email,
      role: invite.role,
      message: invite.message,
      acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept/${invitationId}`,
    });
  }

  getOperationProgress(operationId: string): BulkOperationProgress | null {
    return this.progressTrackers.get(operationId) || null;
  }

  async rollbackOperation(
    _rollbackToken: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    _performingUserId: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<BulkOperationResult> {
    // In a real implementation, retrieve and apply rollback data
    // For now, return a placeholder result
    return {
      success: false,
      processed: 0,
      failed: 0,
      errors: [
        { id: 'rollback', error: 'Rollback functionality not yet implemented' },
      ],
    };
  }
}

export const bulkOperationsManager = new BulkOperationsManager();
