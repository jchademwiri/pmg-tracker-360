'use client';

import { OrganizationCardSkeleton } from './organization-card-skeleton';
import { cn } from '@/lib/utils';

interface OrganizationGridSkeletonProps {
  count?: number;
  className?: string;
}

export function OrganizationGridSkeleton({
  count = 6,
  className,
}: OrganizationGridSkeletonProps) {
  return (
    <div
      className={cn(
        'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
      role="region"
      aria-label="Loading organizations"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <OrganizationCardSkeleton className="h-full" />
        </div>
      ))}
    </div>
  );
}
