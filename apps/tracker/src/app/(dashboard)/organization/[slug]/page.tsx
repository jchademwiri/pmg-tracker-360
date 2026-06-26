import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/server';
import {
  getOrganizationBySlugWithUserRole,
  getUserOrganizationMembership,
} from '@/server/organizations';
import { OrganizationManagementTabs } from './components/organization-management-tabs';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationSettingsWrapper } from '@/components/organization/organization-settings-wrapper';

export const dynamic = 'force-dynamic';

interface OrganizationManagementPageProps {
  params: Promise<{ slug: string }>;
}

async function OrganizationManagementContent({ slug }: { slug: string }) {
  const { currentUser } = await getCurrentUser();

  // Get organization by slug with user role
  const organizationData = await getOrganizationBySlugWithUserRole(slug);

  if (!organizationData) {
    notFound();
  }

  // Check if user has access to this organization
  const userMembership = await getUserOrganizationMembership(
    currentUser.id,
    organizationData.id
  );

  if (!userMembership) {
    // User doesn't belong to this organization
    redirect('/organization');
  }

  return (
    <OrganizationSettingsWrapper>
      <OrganizationManagementTabs
        organization={organizationData}
        userRole={userMembership.role}
        currentUser={currentUser}
      />
    </OrganizationSettingsWrapper>
  );
}

function OrganizationManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function OrganizationManagementPage({
  params,
}: OrganizationManagementPageProps) {
  const { slug } = await params;

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
              Organization Management
            </h1>
            <p className="text-muted-foreground">
              Manage organization details, members, and settings.
            </p>
          </div>
        </div>
      </div>

      {/* Content with Suspense */}
      <Suspense fallback={<OrganizationManagementSkeleton />}>
        <OrganizationManagementContent slug={slug} />
      </Suspense>
    </div>
  );
}
