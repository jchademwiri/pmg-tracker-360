import { getCurrentUser } from '@/server';
import {
  getTenderStats,
  getRecentActivity,
  getUpcomingDeadlines,
  getClosingSoonTenders,
} from '@/server/tenders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  Award,
  XCircle,
  Eye,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { RecentActivity } from '@/components/tenders/recent-activity';
import { UpcomingDeadlines } from '@/components/tenders/upcoming-deadlines';
import { ClosingSoonWidget } from '@/components/tenders/closing-soon-widget';
import { PipelineFunnel } from '@/components/tenders/pipeline-funnel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const statusCards = [
  { label: 'Open Tenders', status: 'open', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
  { label: 'Under Evaluation', status: 'evaluation', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Eye },
  { label: 'Awarded', status: 'awarded', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Award },
  { label: 'Closed', status: 'closed', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', icon: AlertTriangle },
  { label: 'Lost / Rejected', status: 'lost', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
];

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
  const [statsResult, activityResult, deadlinesResult, closingSoonResult] =
    await Promise.all([
      getTenderStats(session.activeOrganizationId),
      getRecentActivity(session.activeOrganizationId, 3),
      getUpcomingDeadlines(session.activeOrganizationId, 3),
      getClosingSoonTenders(session.activeOrganizationId),
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
        trends: { value: 0, winRate: 0 },
      };

  const activity = activityResult.success
    ? activityResult.activity
    : { recentTenders: [], recentChanges: [] };

  const deadlines = deadlinesResult.success ? deadlinesResult.deadlines : [];
  const closingSoon = closingSoonResult.success ? closingSoonResult.tenders : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tender Overview
          </h1>
          <p className="text-muted-foreground">
            Quick snapshot of your tender pipeline and key metrics.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/tenders/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Tender
          </Link>
        </Button>
      </header>

      {/* Key Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenders}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>All tender applications</span>
              {stats.overdueCount > 0 && (
                <span className="text-red-500 font-medium">· {stats.overdueCount} overdue</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
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
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Estimated pipeline value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats.upcomingDeadlines}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links - Status Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Browse by Status</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statusCards.map((card) => {
            const count =
              stats.statusCounts[card.status as keyof typeof stats.statusCounts] ?? 0;
            return (
              <Link key={card.status} href={`/tenders?status=${card.status}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer group ${card.border} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {card.label}
                        </p>
                        <p className={`text-2xl font-bold ${card.color}`}>{count}</p>
                      </div>
                      <div className={`${card.bg} ${card.color} rounded-lg p-2`}>
                        <card.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className={`mt-2 flex items-center text-xs ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      View register <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pipeline Funnel */}
      <PipelineFunnel statusCounts={stats.statusCounts} />

      {/* Closing Soon and Upcoming Deadlines */}
      <div className="grid gap-6 md:grid-cols-2">
        <ClosingSoonWidget tenders={closingSoon} />
        <UpcomingDeadlines deadlines={deadlines} />
      </div>

      {/* Recent Activity */}
      <RecentActivity
        recentTenders={activity.recentTenders}
        recentChanges={activity.recentChanges}
      />
    </div>
  );
}
