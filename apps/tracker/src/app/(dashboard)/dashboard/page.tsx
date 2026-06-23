import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { checkUserSession } from '@/lib/session-check';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { AdminView } from '@/components/dashboard/admin-view';
import { SpecialistView } from '@/components/dashboard/specialist-view';
import { DashboardUrgencyBanner } from '@/components/dashboard/dashboard-urgency-banner';
import { validateSessionAndOrg } from '@/server/utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { auth } = await import('@/lib/auth');
  const { headers } = await import('next/headers');
  const headersList = await headers();

  // Check if user has an organization
  const sessionCheck = await checkUserSession();

  if (!sessionCheck.hasSession) {
    redirect('/login');
  }

  if (!sessionCheck.hasOrganization) {
    if (sessionCheck.organizationCount && sessionCheck.organizationCount > 0) {
      redirect('/organization/select');
    }

    redirect('/onboarding');
  }

  const organizationId = sessionCheck.activeOrganizationId!;

  // Fetch membership role
  let role = 'member';
  try {
    const sessionDetails = await validateSessionAndOrg(organizationId);
    role = sessionDetails.role;
  } catch (error) {
    console.error('Failed to validate session role:', error);
  }

  const isAdmin = role === 'owner' || role === 'admin' || role === 'manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Welcome back! Here's an overview of your organization's procurement pipeline."
              : "Welcome back! Here's your operational checklist and bidding activity overview."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tenders/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Tender
            </Link>
          </Button>
          {(
            await auth.api.hasPermission({
              headers: headersList,
              body: {
                permissions: {
                  purchase_order: ['create'],
                },
              },
            })
          ).success && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects/purchase-orders/create">
                <Plus className="mr-2 h-4 w-4" />
                Create PO
              </Link>
            </Button>
          )}

          {(
            await auth.api.hasPermission({
              headers: headersList,
              body: {
                permissions: {
                  project: ['create'],
                },
              },
            })
          ).success && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Urgency Action Queue */}
      <Suspense fallback={<div className="h-12 rounded-xl bg-muted/30 animate-pulse" />}>
        <DashboardUrgencyBanner organizationId={organizationId} />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        {isAdmin ? (
          <AdminView organizationId={organizationId} />
        ) : (
          <SpecialistView organizationId={organizationId} />
        )}
      </Suspense>
    </div>
  );
}
