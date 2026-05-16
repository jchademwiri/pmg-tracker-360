'use client';
import { User } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// addMember import removed as it's not used in this component
import { useState } from 'react';
import { Loader, AlertCircle, RefreshCw, Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { handleError, handleSuccess } from '@/lib/error-handler';

interface AllUsersProps {
  users: User[];
  organizationId?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Loading skeleton for all users
function AllUsersLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-40" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Error state for all users
function AllUsersErrorState({
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
          Failed to Load Users
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

// Empty state for all users
function AllUsersEmptyState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">No Users Available</CardTitle>
        <p className="text-sm text-muted-foreground">
          There are no users available to invite to this organization.
        </p>
      </CardHeader>
    </Card>
  );
}

export function AllUsers({
  users,
  organizationId,
  isLoading = false,
  error = null,
  onRetry,
}: AllUsersProps) {
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const router = useRouter();

  // Handle loading state
  if (isLoading) {
    return <AllUsersLoadingSkeleton />;
  }

  // Handle error state
  if (error) {
    return <AllUsersErrorState error={error} onRetry={onRetry} />;
  }

  // Handle empty state
  if (users.length === 0) {
    return <AllUsersEmptyState />;
  }

  const handleInviteMember = async (user: User) => {
    if (!organizationId || !user.id) {
      handleError('Missing organization ID or user ID', {
        title: 'Invitation Failed',
      });
      return;
    }

    try {
      setProcessingUserId(user.id);

      const { error } = await authClient.organization.inviteMember({
        email: user.email,
        role: 'member',
        organizationId,
        resend: true,
      });

      if (error) {
        handleError(error.message || 'Unknown error occurred', {
          title: 'Invitation Failed',
        });
        return;
      }

      handleSuccess('User invited successfully!', {
        description: `${user.name} has been invited to join the organization`,
      });

      router.refresh();
    } catch (error) {
      handleError(error as Error, {
        title: 'Invitation Failed',
        fallbackMessage: 'Failed to invite user to organization',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Users
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {users.length} user{users.length === 1 ? '' : 's'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const isProcessing = processingUserId === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  onClick={() => handleInviteMember(user)}
                  disabled={isProcessing || !organizationId}
                  size="sm"
                  className="ml-4 flex-shrink-0"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
