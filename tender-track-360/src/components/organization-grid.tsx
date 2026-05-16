'use client';

import { OrganizationCard } from './organization-card';
import { CreateOrganizationCard } from './create-organization-card';

import { cn } from '@/lib/utils';
import type { OrganizationWithStats } from '@/server/organizations';
import { EmptyOrganizationsState } from './shared/empty-states';

interface OrganizationGridProps {
  organizations: OrganizationWithStats[];
  activeOrganizationId?: string;
  onCreateOrganization?: () => void;
  className?: string;
}

export function OrganizationGrid({
  organizations,
  activeOrganizationId,
  onCreateOrganization,
  className,
}: OrganizationGridProps) {
  // Show empty state when no organizations exist
  if (organizations.length === 0) {
    return (
      <EmptyOrganizationsState
        onCreateOrganization={onCreateOrganization}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        // Base grid layout
        'grid gap-6',
        // Mobile: 1 column (default)
        'grid-cols-1',
        // Tablet: 2 columns
        'sm:grid-cols-2',
        // Desktop: Auto-fit with minimum 320px width
        'lg:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]',
        // Extra large screens: Maximum 4 columns
        'xl:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] xl:max-w-[1400px]',
        // Responsive padding and margins
        'w-full mx-auto',
        className
      )}
      role="region"
      aria-label="Organizations"
    >
      {organizations.map((organization) => (
        <div key={organization.id}>
          <OrganizationCard
            organization={organization}
            memberCount={organization.memberCount}
            isActive={activeOrganizationId === organization.id}
            userRole={organization.userRole}
            className="h-full"
          />
        </div>
      ))}

      {/* Create Organization Card */}
      <div>
        <CreateOrganizationCard
          onClick={onCreateOrganization}
          className="h-full"
        />
      </div>
    </div>
  );
}
