import { getCurrentUser } from '@/server';
import { getProjectStats, getRecentProjectActivities } from '@/server/projects';
import { RecentActivitySection } from '@/components/recent-activity-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Receipt, Banknote, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';

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

  const statsResult = await getProjectStats(session.activeOrganizationId);
  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalProjects: 0,
        statusCounts: { active: 0, completed: 0, cancelled: 0 },
        activePOs: 0,
        totalPOAmount: 0,
        growth: 0,
      };

  const activities = await getRecentProjectActivities(
    session.activeOrganizationId,
    10
  );

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
              <Link href="/dashboard/projects/create">
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
              <Link href="/dashboard/projects/purchase-orders/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Purchase Order
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.statusCounts.active}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active POs</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePOs}</div>
            <p className="text-xs text-muted-foreground">
              Active purchase orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total PO Amount
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPOAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Combined PO value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp
              className={`h-4 w-4 ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {stats.growth >= 0 ? '+' : ''}
              {stats.growth}%
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly project growth
            </p>
          </CardContent>
        </Card>
      </div>

      <RecentActivitySection activities={activities} />
    </div>
  );
}
