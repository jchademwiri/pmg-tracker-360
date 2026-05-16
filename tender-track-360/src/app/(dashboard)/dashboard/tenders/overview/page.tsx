import { getCurrentUser } from '@/server';
import {
  getTenderStats,
  getRecentActivity,
  getUpcomingDeadlines,
  getTendersOverview,
} from '@/server/tenders';
import { getClients } from '@/server/clients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { RecentActivity } from '@/components/tenders/recent-activity';
import { UpcomingDeadlines } from '@/components/tenders/upcoming-deadlines';
import { TendersOverviewClient } from './client-wrapper';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TendersOverviewPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view tender overview.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all data in parallel
  const [
    statsResult,
    activityResult,
    deadlinesResult,
    clientsResult,
    tendersResult,
  ] = await Promise.all([
    getTenderStats(session.activeOrganizationId),
    getRecentActivity(session.activeOrganizationId, 3),
    getUpcomingDeadlines(session.activeOrganizationId, 3),
    getClients(session.activeOrganizationId),
    getTendersOverview(session.activeOrganizationId, {}, 1, 20),
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalTenders: 0,
        statusCounts: { draft: 0, submitted: 0, won: 0, lost: 0, pending: 0 },
        totalValue: 0,
        winRate: 0,
        averageValue: 0,
        upcomingDeadlines: 0,
        overdueCount: 0,
      };

  const activity = activityResult.success
    ? activityResult.activity
    : {
        recentTenders: [],
        recentChanges: [],
      };

  const deadlines = deadlinesResult.success ? deadlinesResult.deadlines : [];

  const clients = clientsResult.clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const tendersData = tendersResult.success
    ? tendersResult
    : {
        tenders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      };

  const activeCount =
    stats.statusCounts.draft +
    stats.statusCounts.submitted +
    stats.statusCounts.pending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tender Management Overview
          </h1>
          <p className="text-muted-foreground">
            Manage your tender applications and track submission progress.
          </p>
        </div>
        <Button asChild size={'lg'}>
          <Link href="/dashboard/tenders/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Tender
          </Link>
        </Button>
      </header>

      {/* Key Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenders}</div>
            <p className="text-xs text-muted-foreground">
              All tender applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tenders
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(stats.winRate * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined tender value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingDeadlines deadlines={deadlines} />
        <RecentActivity
          recentTenders={activity.recentTenders}
          recentChanges={activity.recentChanges}
        />
      </div>

      {/* Tenders Table with Search/Filters */}
      <TendersOverviewClient
        initialTenders={tendersData.tenders}
        initialTotalCount={tendersData.totalCount}
        initialCurrentPage={tendersData.currentPage}
        initialTotalPages={tendersData.totalPages}
        clients={clients}
        organizationId={session.activeOrganizationId}
      />
    </div>
  );
}
