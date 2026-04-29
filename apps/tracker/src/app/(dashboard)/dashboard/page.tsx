import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { Button } from '@pmg/ui/components/ui/button';
import { Skeleton } from '@pmg/ui/components/ui/skeleton';
import { getTenderStats, getUpcomingDeadlines } from '@/server/tenders';
import { getProjectStats } from '@/server/projects';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardDeadlines } from '@/components/dashboard/dashboard-deadlines';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Dashboard' };

function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');
  if (!session.hasOrganization) redirect('/onboarding');

  const organizationId = session.activeOrganizationId!;

  const [tenderStats, projectStats, deadlines] = await Promise.all([
    getTenderStats(organizationId),
    getProjectStats(organizationId),
    getUpcomingDeadlines(organizationId, 5),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your tender activities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/tenders/create">
              <Plus className="mr-2 h-4 w-4" />
              New Tender
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/clients/create">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/projects/create">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics tenderStats={tenderStats} projectStats={projectStats} />
      </Suspense>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            <DashboardDeadlines deadlines={deadlines.deadlines ?? []} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl" />}>
            {/* Quick links card */}
            <div className="rounded-xl border bg-card p-6 space-y-3">
              <h3 className="font-semibold">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { href: '/dashboard/tenders', label: 'View all tenders' },
                  { href: '/dashboard/clients', label: 'Manage clients' },
                  { href: '/dashboard/projects', label: 'View projects' },
                  { href: '/dashboard/projects/purchase-orders', label: 'Purchase orders' },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    → {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
