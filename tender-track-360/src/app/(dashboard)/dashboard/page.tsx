import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { checkUserSession } from '@/lib/session-check';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { DashboardActivity } from '@/components/dashboard/dashboard-activity';
import { DashboardDeadlines } from '@/components/dashboard/dashboard-deadlines';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function MetricsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-[300px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
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
    redirect('/onboarding');
  }

  const organizationId = sessionCheck.activeOrganizationId!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your tender management
            activities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/tenders/create">
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
              <Link href="/dashboard/projects/purchase-orders/create">
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
              <Link href="/dashboard/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/clients/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Client
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics organizationId={organizationId} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts organizationId={organizationId} />
      </Suspense>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <DashboardActivity organizationId={organizationId} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <DashboardDeadlines organizationId={organizationId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
