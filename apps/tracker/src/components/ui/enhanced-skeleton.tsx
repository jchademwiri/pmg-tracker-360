'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Enhanced skeleton components for specific use cases

export function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-4 w-4" /> {/* Checkbox */}
      <div className="flex items-center space-x-3 flex-1">
        <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
        <div className="space-y-1 flex-1">
          <Skeleton className="h-4 w-32" /> {/* Name */}
          <Skeleton className="h-3 w-48" /> {/* Email */}
        </div>
      </div>
      <Skeleton className="h-5 w-16" /> {/* Role badge */}
      <Skeleton className="h-5 w-14" /> {/* Status badge */}
      <Skeleton className="h-4 w-20" /> {/* Date */}
      <Skeleton className="h-8 w-8" /> {/* Actions */}
    </div>
  );
}

export function InvitationRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-4 w-4" /> {/* Checkbox */}
      <Skeleton className="h-4 w-48" /> {/* Email */}
      <Skeleton className="h-5 w-16" /> {/* Role badge */}
      <Skeleton className="h-5 w-14" /> {/* Status badge */}
      <Skeleton className="h-4 w-24" /> {/* Invited by */}
      <Skeleton className="h-4 w-20" /> {/* Expires */}
      <Skeleton className="h-8 w-8" /> {/* Actions */}
    </div>
  );
}

export function MembersTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" /> {/* Title */}
          <Skeleton className="h-9 w-28" /> {/* Invite button */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Table header */}
          <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Table rows */}
          {Array.from({ length: rows }).map((_, index) => (
            <MemberRowSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InvitationsTableSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" /> {/* Icon */}
          <Skeleton className="h-6 w-40" /> {/* Title */}
          <Skeleton className="h-5 w-8 ml-auto" /> {/* Badge */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Table header */}
          <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Table rows */}
          {Array.from({ length: rows }).map((_, index) => (
            <InvitationRowSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationHeaderSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Skeleton className="h-8 w-48" /> {/* Organization name */}
                <Skeleton className="h-5 w-16" /> {/* Role badge */}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-24" /> {/* Member count */}
                <Skeleton className="h-4 w-32" /> {/* Created date */}
              </div>
              <Skeleton className="h-4 w-full max-w-md" /> {/* Description */}
            </div>
          </div>
          <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
            <Skeleton className="h-8 w-16" /> {/* Edit button */}
            <Skeleton className="h-8 w-20" /> {/* Settings button */}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export function OrganizationStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" /> {/* Title */}
            <Skeleton className="h-4 w-4" /> {/* Icon */}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" /> {/* Value */}
                <Skeleton className="h-3 w-32" /> {/* Description */}
              </div>
              <Skeleton className="h-5 w-12" /> {/* Badge */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <section className="flex max-w-5xl gap-6 flex-col py-8 mx-auto px-4">
      {/* Organization Header Skeleton */}
      <OrganizationHeaderSkeleton />

      {/* Organization Stats Skeleton */}
      <OrganizationStatsSkeleton />

      {/* Main Content Skeleton */}
      <div className="space-y-6">
        {/* Members Table Skeleton */}
        <MembersTableSkeleton rows={4} />

        {/* Pending Invitations Skeleton */}
        <InvitationsTableSkeleton rows={2} />
      </div>
    </section>
  );
}

// Loading states for specific actions
export function ActionLoadingSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function FormLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Select */}
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Skeleton className="h-10 w-20" /> {/* Cancel button */}
        <Skeleton className="h-10 w-24" /> {/* Submit button */}
      </div>
    </div>
  );
}

// Error state skeletons (for when we want to show structure but indicate error)
export function ErrorStateSkeleton({ message }: { message: string }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
