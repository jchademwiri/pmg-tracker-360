import { Suspense } from 'react';
import { getorganizations } from '@/server/organizations';
import { Building2, Users, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationGrid } from '@/components/organization-grid';
import { OrganizationGridSkeleton } from '@/components/shared/loading';

export const dynamic = 'force-dynamic';

async function OrganizationContent() {
  try {
    const organizations = await getorganizations();

    // Calculate summary statistics
    const totalOrganizations = organizations.length;
    const totalMembers = organizations.reduce(
      (sum, org) => sum + org.memberCount,
      0
    );
    const ownedOrganizations = organizations.filter(
      (org) => org.userRole === 'owner'
    ).length;
    const managedOrganizations = organizations.filter((org) =>
      ['owner', 'admin', 'manager'].includes(org.userRole)
    ).length;

    return (
      <div className="space-y-8">
        {/* Summary Statistics */}
        {organizations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Organizations
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrganizations}</div>
                <p className="text-xs text-muted-foreground">
                  Organizations you belong to
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all organizations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Organizations Owned
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ownedOrganizations}</div>
                <p className="text-xs text-muted-foreground">
                  You have full control
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Management Access
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{managedOrganizations}</div>
                <p className="text-xs text-muted-foreground">
                  Can manage settings
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizations Grid */}
        <OrganizationGrid organizations={organizations} />
      </div>
    );
  } catch (error) {
    console.error('Error loading organizations:', error);
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Failed to Load Organizations
        </h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading your organizations.
        </p>
        <p className="text-sm text-muted-foreground">
          Please try refreshing the page or contact support if the problem
          persists.
        </p>
      </div>
    );
  }
}

export default async function OrganisationSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Organization Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your organizations, team members, and organizational
              settings.
            </p>
          </div>
        </div>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<OrganizationGridSkeleton />}>
        <OrganizationContent />
      </Suspense>
    </div>
  );
}
