import { getCurrentUser } from '@/server';
import { getProjectStats, getRecentProjectActivities, getProjectActionQueue } from '@/server/projects';
import { RecentActivitySection } from '@/components/recent-activity-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse, Truck, ShieldAlert, Banknote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import { ProjectActionQueue } from '@/components/projects/project-action-queue';

export const dynamic = 'force-dynamic';

export default async function ProjectsOverviewPage() {
  const { session } = await getCurrentUser();
  const { auth } = await import('@/lib/auth');
  const { headers } = await import('next/headers');
  const headersList = await headers();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view project overview.
          </p>
        </div>
      </div>
    );
  }

  // Fetch stats, activities, and queues in parallel
  const [statsResult, activities, actionQueueResult] = await Promise.all([
    getProjectStats(session.activeOrganizationId),
    getRecentProjectActivities(session.activeOrganizationId, 10),
    getProjectActionQueue(session.activeOrganizationId)
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalProjects: 0,
        statusCounts: { active: 0, completed: 0, cancelled: 0 },
        healthStats: { onTrack: 0, delayed: 0, critical: 0 },
        deliveryStats: { totalPOs: 0, pendingDeliveries: 0, partialDeliveries: 0, fullyDelivered: 0 },
        riskStats: { totalActiveRisks: 0, highCriticalRisks: 0 },
        financialStats: { totalAwardValue: 0, totalPOValue: 0, totalDeliveredValue: 0, remainingValue: 0 },
        growth: 0,
      };

  const initialQueues = actionQueueResult.success
    ? actionQueueResult.queues
    : {
        overdueDeliveries: [],
        partialDeliveries: [],
        highRisks: [],
        closeOutCandidates: [],
      };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Management Overview
          </h1>
          <p className="text-muted-foreground">
            Manage active projects, contracts, and purchase orders.
          </p>
        </div>
        <div className="flex gap-2">
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
            <Button asChild size={'lg'}>
              <Link href="/projects/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Link>
            </Button>
          )}

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
            <Button asChild size={'lg'}>
              <Link href="/projects/purchase-orders/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Purchase Order
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Project Action Queue */}
      <ProjectActionQueue
        organizationId={session.activeOrganizationId}
        initialQueues={initialQueues}
      />

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Project Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Project Health
            </CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold flex items-baseline gap-2">
              <span className="text-emerald-500 font-bold">{stats.healthStats.onTrack}</span>
              <span className="text-xs text-muted-foreground font-normal">on track</span>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-red-500 font-semibold">{stats.healthStats.critical} critical</span>
              <span>•</span>
              <span className="text-amber-500 font-semibold">{stats.healthStats.delayed} delayed</span>
            </div>
          </CardContent>
        </Card>

        {/* PO Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PO Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">
              {stats.deliveryStats.fullyDelivered} / {stats.deliveryStats.totalPOs}
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{stats.deliveryStats.pendingDeliveries} pending</span>
              <span>•</span>
              <span>{stats.deliveryStats.partialDeliveries} partial</span>
            </div>
          </CardContent>
        </Card>

        {/* Project Risks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Project Risks
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">
              {stats.riskStats.totalActiveRisks}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.riskStats.highCriticalRisks > 0 ? 'text-red-500 font-semibold' : ''}>
                {stats.riskStats.highCriticalRisks} high / critical
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Financial Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed / Awarded</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg font-bold truncate" title={`${formatCurrency(stats.financialStats.totalPOValue)} / ${formatCurrency(stats.financialStats.totalAwardValue)}`}>
              {formatCurrency(stats.financialStats.totalPOValue)} / {formatCurrency(stats.financialStats.totalAwardValue)}
            </div>
            <div className="flex gap-1.5 text-xs text-muted-foreground truncate">
              <span>Del: {formatCurrency(stats.financialStats.totalDeliveredValue)}</span>
              <span>•</span>
              <span>Rem: {formatCurrency(stats.financialStats.remainingValue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <RecentActivitySection activities={activities} />
    </div>
  );
}
