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

type SearchParams = {
  search?: string;
  status?: string;
  clientId?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
};

const validSortBy = ['tenderNumber', 'createdAt', 'submissionDate', 'status'] as const;
const validSortOrder = ['asc', 'desc'] as const;

function parseTenderFilters(searchParams: SearchParams) {
  const status = searchParams.status || 'all';
  const sortBy = validSortBy.includes(searchParams.sortBy as any)
    ? (searchParams.sortBy as (typeof validSortBy)[number])
    : status === 'open' || status === 'all'
      ? 'submissionDate'
      : 'createdAt';
  const sortOrder = validSortOrder.includes(searchParams.sortOrder as any)
    ? (searchParams.sortOrder as (typeof validSortOrder)[number])
    : status === 'open' || status === 'all'
      ? 'asc'
      : 'desc';
  const page = Math.max(Number(searchParams.page || '1') || 1, 1);

  return {
    filters: {
      search: searchParams.search || '',
      status,
      clientId: searchParams.clientId || 'all',
      sortBy,
      sortOrder,
    },
    page,
  };
}

function getRegisterCopy(status: string) {
  switch (status) {
    case 'open':
      return {
        title: 'Open Tenders',
        description: 'Track tender opportunities that are still open for submission.',
      };
    case 'evaluation':
      return {
        title: 'Under Evaluation',
        description: 'Monitor submitted tenders that are currently under evaluation.',
      };
    case 'closed':
      return {
        title: 'Closed',
        description: 'Review tenders marked as closed.',
      };
    case 'awarded':
      return {
        title: 'Awarded Tenders',
        description: 'Review successful tenders and appointed work.',
      };
    case 'lost':
      return {
        title: 'Lost / Rejected Tenders',
        description: 'Review unsuccessful tender outcomes.',
      };
    default:
      return {
        title: 'Tender Register',
        description: 'Search, filter, and manage all tender records from one place.',
      };
  }
}

export default async function TendersOverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { session } = await getCurrentUser();
  const { filters, page } = parseTenderFilters(await searchParams);
  const registerCopy = getRegisterCopy(filters.status);

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
    getTendersOverview(session.activeOrganizationId, filters, page, 20),
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalTenders: 0,
        statusCounts: { open: 0, closed: 0, evaluation: 0, awarded: 0, lost: 0 },
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {registerCopy.title}
          </h1>
          <p className="text-muted-foreground">
            {registerCopy.description}
          </p>
        </div>
        <Button asChild size={'lg'}>
          <Link href="/tenders/create">
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
            <CardTitle className="text-sm font-medium">Open Tenders</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.statusCounts.open}
            </div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Under Evaluation
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.statusCounts.evaluation}
            </div>
            <p className="text-xs text-muted-foreground">
              Tenders currently under evaluation
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
            <CardTitle className="text-sm font-medium">
              Estimated Total Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated value of all tenders
            </p>
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
        initialFilters={filters}
        clients={clients}
        organizationId={session.activeOrganizationId}
      />
    </div>
  );
}
