'use client';

import { useState } from 'react';
import { organization, Role } from '@pmg/db';
import { Card, CardContent, CardHeader } from '@pmg/ui/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@pmg/ui/components/ui/avatar';
import { Button } from '@pmg/ui/components/ui/button';
import { Badge } from '@pmg/ui/components/ui/badge';
import { Skeleton } from '@pmg/ui/components/ui/skeleton';
import {
  Edit,
  Settings,
  Users,
  Calendar,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { handleError, handleSuccess } from '@/lib/error-handler';

interface OrganizationHeaderProps {
  organization: typeof organization.$inferSelect & {
    memberCount?: number;
    userRole?: Role;
  };
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Loading skeleton for organization header
function OrganizationHeaderSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
          <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// Error state for organization header
function OrganizationHeaderError({
  error,
  onRetry,
  className = '',
}: {
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card className={`w-full border-destructive/50 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-destructive">
          Failed to Load Organization
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </CardHeader>
      {onRetry && (
        <CardContent className="text-center">
          <Button onClick={onRetry} variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export function OrganizationHeader({
  organization,
  className = '',
  isLoading = false,
  error = null,
  onRetry,
}: OrganizationHeaderProps) {
  // TODO: Implement editing functionality
  // const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle loading state
  if (isLoading) {
    return <OrganizationHeaderSkeleton className={className} />;
  }

  // Handle error state
  if (error) {
    return (
      <OrganizationHeaderError
        error={error}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Check if user has admin permissions (owner or admin)
  const canEdit =
    organization.userRole && ['owner', 'admin'].includes(organization.userRole);

  // Generate organization initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format creation date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const handleEditClick = async () => {
    try {
      setIsProcessing(true);
      // TODO: Implement edit functionality in future tasks
      // setIsEditing(true);

      // Removed simulated delay; this will be replaced with real async work

      handleSuccess('Edit mode enabled', {
        description: 'You can now edit organization details',
      });
    } catch (error) {
      handleError(error as Error, {
        title: 'Edit Failed',
        fallbackMessage: 'Failed to enable edit mode',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSettingsClick = async () => {
    try {
      setIsProcessing(true);
      // TODO: Navigate to organization settings

      // Removed simulated delay; navigate immediately when implemented

      handleSuccess('Opening settings', {
        description: 'Redirecting to organization settings',
      });
    } catch (error) {
      handleError(error as Error, {
        title: 'Settings Failed',
        fallbackMessage: 'Failed to open organization settings',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Organization Info Section */}
          <div className="flex items-start gap-4 flex-1">
            {/* Organization Avatar */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
              <AvatarImage
                src={organization.logo || undefined}
                alt={`${organization.name} logo`}
                className="object-cover"
              />
              <AvatarFallback className="text-lg sm:text-xl font-semibold bg-primary/10 text-primary">
                {getInitials(organization.name)}
              </AvatarFallback>
            </Avatar>

            {/* Organization Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {organization.name}
                </h1>
                {organization.userRole && (
                  <Badge
                    variant={
                      organization.userRole === 'owner'
                        ? 'default'
                        : 'secondary'
                    }
                    className="w-fit"
                  >
                    {organization.userRole}
                  </Badge>
                )}
              </div>

              {/* Organization Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {organization.memberCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {organization.memberCount}{' '}
                      {organization.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(organization.createdAt)}</span>
                </div>
              </div>

              {/* Organization Description/Metadata */}
              {organization.metadata && (
                <p className="mt-2 text-muted-foreground text-sm sm:text-base">
                  {organization.metadata}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                disabled={isProcessing}
                className="flex items-center gap-2"
                aria-label={`Edit ${organization.name}`}
              >
                {isProcessing ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isProcessing ? 'Loading...' : 'Edit'}
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSettingsClick}
                disabled={isProcessing}
                className="flex items-center gap-2"
                aria-label={`${organization.name} settings`}
              >
                {isProcessing ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isProcessing ? 'Loading...' : 'Settings'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Additional Content Area */}
      <CardContent className="pt-0">
        {/* Empty state for description if none exists and user can edit */}
        {!organization.metadata && canEdit && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              No description added yet
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              disabled={isProcessing}
              className="text-primary hover:text-primary/80"
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Add description'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
