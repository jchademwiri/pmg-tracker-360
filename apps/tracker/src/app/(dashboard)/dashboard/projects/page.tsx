import { getProjectStats, getRecentProjectActivities } from '@/server/projects';
import { RecentActivitySection } from '@/components/recent-activity-section';
import { Card, CardContent, CardHeader, CardTitle } from '@pmg/ui/components/ui/card';
import { FolderOpen, Receipt, Banknote, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@pmg/ui/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import { redirect } from 'next/navigation';
import { checkUserSession } from '@/lib/session-check';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');
  const organizationId = session.activeOrganizationId ?? 'stub-org-id';

  const [statsResult, activities] = await Promise.all([
    getProjectStats(organizationId),
    getRecentProjectActivities(organizationId, 10),
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : { totalProjects: 0, statusCounts: { active: 0, completed: 0, cancelled: 0 }, activePOs: 0, totalPOAmount: 0, growth: 0 };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage active projects, contracts, and purchase orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/purchase-orders/create">
              <Plus className="h-4 w-4 mr-2" />
              New PO
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statusCounts.active}</div>
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
            <p className="text-xs text-muted-foreground">Active purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPOAmount)}</div>
            <p className="text-xs text-muted-foreground">Combined PO value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className={`h-4 w-4 ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.growth >= 0 ? '+' : ''}{stats.growth}%
            </div>
            <p className="text-xs text-muted-foreground">Monthly growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity + quick links */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivitySection activities={activities} />
        </div>
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm font-medium mb-3">Quick Actions</p>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/projects/active">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View All Projects
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/purchase-orders">
                  <Receipt className="h-4 w-4 mr-2" />
                  View Purchase Orders
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
