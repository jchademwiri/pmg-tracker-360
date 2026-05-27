'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Trash2,
  UserX,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  icon?: 'warning' | 'delete' | 'remove' | 'cancel' | 'custom';
  customIcon?: React.ReactNode;
  showProgress?: boolean;
  disabled?: boolean;
}

interface OperationState {
  isProcessing: boolean;
  progress: number;
  currentOperation: string;
  results?: {
    success: boolean;
    message?: string;
    errors?: string[];
  };
}

const ICONS = {
  warning: AlertTriangle,
  delete: Trash2,
  remove: UserX,
  cancel: X,
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon = 'warning',
  customIcon,
  showProgress = false,
  disabled = false,
}: ConfirmationDialogProps) {
  const [operationState, setOperationState] = useState<OperationState>({
    isProcessing: false,
    progress: 0,
    currentOperation: '',
  });

  const handleConfirm = async () => {
    try {
      if (showProgress) {
        setOperationState({
          isProcessing: true,
          progress: 0,
          currentOperation: 'Processing...',
        });

        // Removed simulated progress; run the operation and mark complete
        await onConfirm();

        setOperationState((prev) => ({
          ...prev,
          progress: 100,
          currentOperation: 'Completed',
          results: {
            success: true,
            message: 'Operation completed successfully',
          },
        }));

        // Close immediately after success for faster UX
        handleClose();
      } else {
        setOperationState({
          isProcessing: true,
          progress: 0,
          currentOperation: '',
        });
        await onConfirm();
        handleClose();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      setOperationState((prev) => ({
        ...prev,
        progress: 100,
        currentOperation: 'Failed',
        results: {
          success: false,
          message: errorMessage,
          errors: [errorMessage],
        },
      }));

      if (!showProgress) {
        // Close immediately on error when not showing progress
        handleClose();
      }
    }
  };

  const handleClose = () => {
    if (operationState.isProcessing && !operationState.results) {
      // Don't allow closing while processing
      return;
    }

    setOperationState({
      isProcessing: false,
      progress: 0,
      currentOperation: '',
    });
    onClose();
  };

  const IconComponent = customIcon ? null : ICONS[icon as keyof typeof ICONS];
  const isProcessing = operationState.isProcessing && !operationState.results;
  const canClose = !isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {customIcon ? (
              <div className="flex-shrink-0">{customIcon}</div>
            ) : IconComponent ? (
              <div
                className={`flex-shrink-0 p-2 rounded-full ${
                  variant === 'destructive'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <IconComponent className="h-5 w-5" />
              </div>
            ) : null}
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Section */}
        {showProgress && operationState.isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                {operationState.currentOperation}
              </span>
            </div>
            <Progress value={operationState.progress} className="w-full" />
          </div>
        )}

        {/* Results Section */}
        {operationState.results && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {operationState.results.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {operationState.results.message}
              </span>
            </div>
            {operationState.results.errors &&
              operationState.results.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  {operationState.results.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={!canClose}>
            {operationState.results ? 'Close' : cancelText}
          </Button>
          {!operationState.results && (
            <Button
              variant={variant}
              onClick={handleConfirm}
              disabled={isProcessing || disabled}
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialized confirmation dialogs for common use cases
export interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemName: string;
  itemType?: string;
  showProgress?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  showProgress = false,
}: DeleteConfirmationProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      variant="destructive"
      icon="delete"
      showProgress={showProgress}
    />
  );
}

export interface RemoveMemberConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  memberName: string;
  memberCount?: number;
  showProgress?: boolean;
}

export function RemoveMemberConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  memberCount = 1,
  showProgress = false,
}: RemoveMemberConfirmationProps) {
  const isMultiple = memberCount > 1;

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Remove ${isMultiple ? 'Members' : 'Member'}`}
      description={
        isMultiple
          ? `Are you sure you want to remove ${memberCount} members from the organization? They will lose access to all organization resources.`
          : `Are you sure you want to remove "${memberName}" from the organization? They will lose access to all organization resources.`
      }
      confirmText={`Remove ${isMultiple ? `${memberCount} Members` : 'Member'}`}
      variant="destructive"
      icon="remove"
      showProgress={showProgress}
    />
  );
}

export interface CancelInvitationConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  email: string;
  invitationCount?: number;
  showProgress?: boolean;
}

export function CancelInvitationConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  email,
  invitationCount = 1,
  showProgress = false,
}: CancelInvitationConfirmationProps) {
  const isMultiple = invitationCount > 1;

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Cancel ${isMultiple ? 'Invitations' : 'Invitation'}`}
      description={
        isMultiple
          ? `Are you sure you want to cancel ${invitationCount} invitations? The invited users will not be able to join the organization using these invitations.`
          : `Are you sure you want to cancel the invitation for "${email}"? They will not be able to join the organization using this invitation.`
      }
      confirmText={`Cancel ${isMultiple ? `${invitationCount} Invitations` : 'Invitation'}`}
      variant="destructive"
      icon="cancel"
      showProgress={showProgress}
    />
  );
}
