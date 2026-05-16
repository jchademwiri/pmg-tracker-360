'use client';

import { organization } from '@/db/schema';
import { cn } from '@/lib/utils';

interface OrganizationPageHeaderProps {
  organizationCount: number;
  activeOrganization?: typeof organization.$inferSelect;
  className?: string;
}

export function OrganizationPageHeader({
  organizationCount,
  activeOrganization,
  className,
}: OrganizationPageHeaderProps) {
  return (
    <div className={cn('text-center space-y-4', className)}>
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Tender Track 360</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {organizationCount === 0
            ? 'Create your first organization to get started'
            : organizationCount === 1
              ? 'Manage your organization'
              : `Choose from ${organizationCount} organizations`}
        </p>
      </div>

      {activeOrganization && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
          <div className="size-2 bg-primary rounded-full animate-pulse" />
          <span>Currently in {activeOrganization.name}</span>
        </div>
      )}
    </div>
  );
}
