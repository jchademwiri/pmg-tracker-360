'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { bulkCancelInvitations, bulkRemoveMembers } from '@/server/invitations';
import { X, Trash2, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { handleError, handleSuccess } from '@/lib/error-handler';
import {
  RemoveMemberConfirmationDialog,
  CancelInvitationConfirmationDialog,
} from '@/components/ui/confirmation-dialog';

interface BulkActionsToolbarProps {
  selectedMembers: string[];
  selectedInvitations: string[];
  onClearSelection: () => void;
  className?: string;
}

interface BulkOperationState {
  isProcessing: boolean;
  progress: number;
  currentOperation: string;
  results?: {
    success: boolean;
    removedCount?: number;
    cancelledCount?: number;
    errors?: string[];
  };
}

export function BulkActionsToolbar({
  selectedMembers,
  selectedInvitations,
  onClearSelection,
  className = '',
}: BulkActionsToolbarProps) {
  const [showRemoveMembersDialog, setShowRemoveMembersDialog] = useState(false);
  const [showCancelInvitationsDialog, setShowCancelInvitationsDialog] =
    useState(false);
  const [operationState, setOperationState] = useState<BulkOperationState>({
    isProcessing: false,
    progress: 0,
    currentOperation: '',
  });
  const router = useRouter();

  const totalSelected = selectedMembers.length + selectedInvitations.length;

  // Don't render if nothing is selected
  if (totalSelected === 0) {
    return null;
  }

  const handleRemoveMembers = async () => {
    if (selectedMembers.length === 0) return;

    try {
      setOperationState({
        isProcessing: true,
        progress: 0,
        currentOperation: 'Removing members...',
      });

      // Removed simulated progress updates; rely on actual API completion

      const result = await bulkRemoveMembers(selectedMembers);

      // No simulated interval to clear

      setOperationState((prev) => ({
        ...prev,
        progress: 100,
        currentOperation: 'Completed',
        results: {
          success: result.success,
          removedCount: result.data?.removedCount,
          errors: result.success
            ? []
            : [result.error?.message || 'Unknown error'],
        },
      }));

      if (result.success) {
        handleSuccess(
          `Successfully removed ${result.data?.removedCount} member${
            result.data?.removedCount === 1 ? '' : 's'
          }`,
          {
            description:
              'The selected members have been removed from the organization',
          }
        );
        onClearSelection();
        router.refresh();
      } else {
        handleError(result.error || 'Failed to remove members', {
          title: 'Bulk Remove Failed',
        });
      }
    } catch (error) {
      setOperationState((prev) => ({
        ...prev,
        progress: 100,
        currentOperation: 'Failed',
        results: {
          success: false,
          errors: ['An unexpected error occurred'],
        },
      }));
      handleError(error as Error, {
        title: 'Bulk Remove Failed',
        fallbackMessage: 'Failed to remove members',
      });
    } finally {
      // Close immediately after operation completes to improve responsiveness
      setOperationState({
        isProcessing: false,
        progress: 0,
        currentOperation: '',
      });
      setShowRemoveMembersDialog(false);
    }
  };

  const handleCancelInvitations = async () => {
    if (selectedInvitations.length === 0) return;

    try {
      setOperationState({
        isProcessing: true,
        progress: 0,
        currentOperation: 'Cancelling invitations...',
      });

      // Removed simulated progress updates; rely on actual API completion

      const result = await bulkCancelInvitations(selectedInvitations);

      // No simulated interval to clear

      setOperationState((prev) => ({
        ...prev,
        progress: 100,
        currentOperation: 'Completed',
        results: {
          success: result.success,
          cancelledCount: result.data?.cancelledCount,
          errors: result.success
            ? []
            : [result.error?.message || 'Unknown error'],
        },
      }));

      if (result.success) {
        handleSuccess(
          `Successfully cancelled ${result.data?.cancelledCount} invitation${
            result.data?.cancelledCount === 1 ? '' : 's'
          }`,
          {
            description: 'The selected invitations have been cancelled',
          }
        );
        onClearSelection();
        router.refresh();
      } else {
        handleError(result.error || 'Failed to cancel invitations', {
          title: 'Bulk Cancel Failed',
        });
      }
    } catch (error) {
      setOperationState((prev) => ({
        ...prev,
        progress: 100,
        currentOperation: 'Failed',
        results: {
          success: false,
          errors: ['An unexpected error occurred'],
        },
      }));
      handleError(error as Error, {
        title: 'Bulk Cancel Failed',
        fallbackMessage: 'Failed to cancel invitations',
      });
    } finally {
      // Close immediately after operation completes to improve responsiveness
      setOperationState({
        isProcessing: false,
        progress: 0,
        currentOperation: '',
      });
      setShowCancelInvitationsDialog(false);
    }
  };

  return (
    <>
      {/* Floating Toolbar */}
      <div
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      >
        <Card className="shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Selection Summary */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  {totalSelected} selected
                </Badge>
                {selectedMembers.length > 0 && (
                  <Badge variant="outline">
                    {selectedMembers.length} member
                    {selectedMembers.length === 1 ? '' : 's'}
                  </Badge>
                )}
                {selectedInvitations.length > 0 && (
                  <Badge variant="outline">
                    {selectedInvitations.length} invitation
                    {selectedInvitations.length === 1 ? '' : 's'}
                  </Badge>
                )}
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedMembers.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowRemoveMembersDialog(true)}
                    disabled={operationState.isProcessing}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Remove Members
                  </Button>
                )}

                {selectedInvitations.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelInvitationsDialog(true)}
                    disabled={operationState.isProcessing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Invitations
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  disabled={operationState.isProcessing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remove Members Confirmation Dialog */}
      <RemoveMemberConfirmationDialog
        isOpen={showRemoveMembersDialog}
        onClose={() => setShowRemoveMembersDialog(false)}
        onConfirm={handleRemoveMembers}
        memberName=""
        memberCount={selectedMembers.length}
        showProgress={true}
      />

      {/* Cancel Invitations Confirmation Dialog */}
      <CancelInvitationConfirmationDialog
        isOpen={showCancelInvitationsDialog}
        onClose={() => setShowCancelInvitationsDialog(false)}
        onConfirm={handleCancelInvitations}
        email=""
        invitationCount={selectedInvitations.length}
        showProgress={true}
      />
    </>
  );
}
