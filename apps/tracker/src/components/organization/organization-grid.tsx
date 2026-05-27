import { OrganizationCard } from '../organization-card';
import type { OrganizationWithStats } from '@/server/organizations';

interface OrganizationGridProps {
  organizations: OrganizationWithStats[];
}

export function OrganizationGrid({ organizations }: OrganizationGridProps) {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
        <p className="text-muted-foreground mb-4">
          You don&#x27;t belong to any organizations yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Contact your administrator to be added to an organization.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map((organization) => (
        <OrganizationCard key={organization.id} organization={organization} />
      ))}
    </div>
  );
}
