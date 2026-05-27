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
  try {
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
      redirect('/dashboard/organization');
    }

    // If user is just a member, redirect to read-only view
    if (userMembership.role === 'member') {
      redirect(`/dashboard/organization/${slug}`);
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
  } catch (error) {
    console.error('Error loading organization:', error);
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
          Failed to Load Organization
        </h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading the organization details.
        </p>
        <p className="text-sm text-muted-foreground">
          Please try refreshing the page or contact support if the problem
          persists.
        </p>
      </div>
    );
  }
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
