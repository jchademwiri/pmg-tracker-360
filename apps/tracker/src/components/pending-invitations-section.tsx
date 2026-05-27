'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { PendingInvitation } from '@/server/organizations';
import { cancelInvitation, resendInvitation } from '@/server/invitations';
import {
  MoreHorizontal,
  Mail,
  X,
  UserPlus,
  Loader,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { CancelInvitationConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface PendingInvitationsSectionProps {
  invitations: PendingInvitation[];
  selectedInvitations?: string[];
  onSelectionChange?: (invitationIds: string[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

// Helper function to get invitation status badge variant
function getInvitationStatusBadgeVariant(status: string, expiresAt: Date) {
  const now = new Date();
  const isExpired = now > expiresAt;

  if (isExpired) {
    return 'destructive';
  }

  switch (status.toLowerCase()) {
    case 'pending':
      return 'secondary';
    case 'expired':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
}

// Helper function to get invitation status text
function getInvitationStatusText(status: string, expiresAt: Date) {
  const now = new Date();
  const isExpired = now > expiresAt;

  if (isExpired) {
    return 'Expired';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Helper function to get role badge variant
function getRoleBadgeVariant(role: string) {
  switch (role.toLowerCase()) {
    case 'owner':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'member':
      return 'secondary';
    default:
      return 'outline';
  }
}

// Helper function to format date
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Helper function to get days until expiry
function getDaysUntilExpiry(expiresAt: Date) {
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Loading skeleton component
function PendingInvitationsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Skeleton className="h-4 w-4" />
          </TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-4" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Empty state component
function PendingInvitationsEmptyState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">No pending invitations</CardTitle>
        <p className="text-sm text-muted-foreground">
          All invitations have been accepted or there are no outstanding
          invitations.
        </p>
      </CardHeader>
    </Card>
  );
}

// Error state component
function PendingInvitationsErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg text-destructive">
          Failed to Load Invitations
        </CardTitle>
        <p className="text-sm text-muted-foreground">{error}</p>
      </CardHeader>
      {onRetry && (
        <CardContent className="text-center">
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Individual invitation action component
function InvitationActions({ invitation }: { invitation: PendingInvitation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const router = useRouter();

  const handleResend = async () => {
    try {
      setIsLoading(true);
      const result = await resendInvitation(invitation.id);

      if (!result.success) {
        handleError(result.error || 'Failed to resend invitation', {
          title: 'Resend Failed',
        });
        return;
      }

      handleSuccess('Invitation resent successfully', {
        description: `A new invitation has been sent to ${invitation.email}`,
      });
      router.refresh();
    } catch (error) {
      handleError(error as Error, {
        title: 'Resend Failed',
        fallbackMessage: 'Failed to resend invitation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      const result = await cancelInvitation(invitation.id);

      if (!result.success) {
        handleError(result.error || 'Failed to cancel invitation', {
          title: 'Cancel Failed',
        });
        return;
      }

      handleSuccess('Invitation cancelled successfully', {
        description: `The invitation for ${invitation.email} has been cancelled`,
      });
      setShowCancelDialog(false);
      router.refresh();
    } catch (error) {
      handleError(error as Error, {
        title: 'Cancel Failed',
        fallbackMessage: 'Failed to cancel invitation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const now = new Date();
  const isExpired = now > invitation.expiresAt;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Open menu</span>
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResend} disabled={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            {isExpired ? 'Resend Invitation' : 'Resend Invitation'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCancelDialog(true)}
            className="text-destructive focus:text-destructive"
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Invitation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelInvitationConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        email={invitation.email}
        showProgress={true}
      />
    </>
  );
}

export function PendingInvitationsSection({
  invitations,
  selectedInvitations = [],
  onSelectionChange,
  isLoading = false,
  error = null,
}: PendingInvitationsSectionProps) {
  const router = useRouter();

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendingInvitationsTableSkeleton />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendingInvitationsErrorState
            error={error}
            onRetry={() => router.refresh()}
          />
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendingInvitationsEmptyState />
        </CardContent>
      </Card>
    );
  }

  // Handle select all checkbox
  const isAllSelected =
    invitations.length > 0 && selectedInvitations.length === invitations.length;
  const isIndeterminate =
    selectedInvitations.length > 0 &&
    selectedInvitations.length < invitations.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? invitations.map((inv) => inv.id) : []);
    }
  };

  const handleSelectInvitation = (invitationId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedInvitations, invitationId]);
      } else {
        onSelectionChange(
          selectedInvitations.filter((id) => id !== invitationId)
        );
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Pending Invitations
          <Badge variant="secondary" className="ml-auto">
            {invitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            A list of pending invitations for your organization.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all invitations"
                  {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const statusText = getInvitationStatusText(
                invitation.status,
                invitation.expiresAt
              );
              const statusVariant = getInvitationStatusBadgeVariant(
                invitation.status,
                invitation.expiresAt
              );
              const daysUntilExpiry = getDaysUntilExpiry(invitation.expiresAt);
              const isExpired = daysUntilExpiry <= 0;
              const isSelected = selectedInvitations.includes(invitation.id);

              return (
                <TableRow
                  key={invitation.id}
                  className={isSelected ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectInvitation(
                          invitation.id,
                          checked as boolean
                        )
                      }
                      aria-label={`Select invitation for ${invitation.email}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {invitation.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(invitation.role)}>
                      {invitation.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant}>{statusText}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.inviterName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {isExpired ? (
                      <span className="text-destructive font-medium">
                        Expired
                      </span>
                    ) : (
                      <>
                        {formatDate(invitation.expiresAt)}
                        {daysUntilExpiry <= 3 && (
                          <span className="text-orange-600 dark:text-orange-400 ml-1">
                            ({daysUntilExpiry}d left)
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <InvitationActions invitation={invitation} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
