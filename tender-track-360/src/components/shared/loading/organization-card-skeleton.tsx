'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OrganizationCardSkeletonProps {
  className?: string;
}

export function OrganizationCardSkeleton({
  className,
}: OrganizationCardSkeletonProps) {
  return (
    <Card
      className={cn('group relative overflow-hidden animate-pulse', className)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar skeleton */}
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
              {/* Organization name skeleton */}
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-2">
                {/* Role badge skeleton */}
                <Skeleton className="h-4 w-16 rounded-full" />
                {/* Active badge skeleton (sometimes) */}
                {Math.random() > 0.5 && (
                  <Skeleton className="h-4 w-12 rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Stats skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Actions skeleton */}
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-8 rounded-md" />
            {/* Settings button skeleton (sometimes) */}
            {Math.random() > 0.5 && <Skeleton className="h-8 w-8 rounded-md" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
