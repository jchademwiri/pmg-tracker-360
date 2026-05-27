'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { removeMember } from '@/server';
import { MoreHorizontal, UserMinus, UserCog, Mail, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { handleError, handleSuccess, handleInfo } from '@/lib/error-handler';
import { RemoveMemberConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface MembersTableActionProps {
  memberId: string;
  memberRole: string;
  memberName: string;
  disabled?: boolean;
}

export default function MembersTableAction({
  memberId,
  memberName,
  disabled = false,
}: MembersTableActionProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const { success, error } = await removeMember(memberId);

      if (!success) {
        handleError(error || 'Failed to remove member', {
          title: 'Remove Failed',
        });
        return;
      }

      handleSuccess('Member removed successfully', {
        description: `${memberName} has been removed from the organization`,
      });
      setShowRemoveDialog(false);
      router.refresh();
    } catch (error) {
      handleError(error as Error, {
        title: 'Remove Failed',
        fallbackMessage: 'Failed to remove member from organization',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditRole = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      // TODO: Implement role editing functionality
      // Removed artificial delay; this will be wired to a real API

      handleInfo('Role editing functionality coming soon', {
        title: 'Feature Coming Soon',
        description: 'This feature is currently under development',
      });
    } catch (error) {
      handleError(error as Error, {
        title: 'Edit Role Failed',
        fallbackMessage: 'Failed to edit member role',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendInvitation = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      // TODO: Implement resend invitation functionality
      // Removed artificial delay; this will be wired to a real API

      handleInfo('Resend invitation functionality coming soon', {
        title: 'Feature Coming Soon',
        description: 'This feature is currently under development',
      });
    } catch (error) {
      handleError(error as Error, {
        title: 'Resend Failed',
        fallbackMessage: 'Failed to resend invitation',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={disabled || isProcessing}
          >
            <span className="sr-only">Open menu</span>
            {isProcessing ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEditRole} disabled={isProcessing}>
            <UserCog className="mr-2 h-4 w-4" />
            Edit Role
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleResendInvitation}
            disabled={isProcessing}
          >
            <Mail className="mr-2 h-4 w-4" />
            Resend Invitation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowRemoveDialog(true)}
            disabled={isProcessing}
            className="text-destructive focus:text-destructive"
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Remove Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveMemberConfirmationDialog
        isOpen={showRemoveDialog}
        onClose={() => setShowRemoveDialog(false)}
        onConfirm={handleRemove}
        memberName={memberName}
        showProgress={true}
      />
    </>
  );
}

// https://youtu.be/QN2ljJ5MjV4?list=PLb3Vtl4F8GHTUJ_RmNINhE6GxB97otFzS&t=1992
