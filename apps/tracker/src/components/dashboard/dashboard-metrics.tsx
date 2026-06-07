import {
  formatCurrency,
  formatPercentage,
  formatNumber,
} from '@/lib/dashboard-data';
import { MetricCard } from '@/components/ui/metric-card';
import { Banknote, Target, TrendingUp, Calendar } from 'lucide-react';
import { getTenderStats } from '@/server/tenders';
import { getClientStats } from '@/server/clients';
import { getProjectStats } from '@/server/projects';

interface DashboardMetricsProps {
  organizationId: string;
}

export async function DashboardMetrics({
  organizationId,
}: DashboardMetricsProps) {
  let tenderStats = null;
  let clientStats = null;
  let projectStats = null;

  try {
    const [tenderStatsResult, clientStatsResult, projectStatsResult] =
      await Promise.all([
        getTenderStats(organizationId),
        getClientStats(organizationId),
        getProjectStats(organizationId),
      ]);

    if (tenderStatsResult?.success) tenderStats = tenderStatsResult.stats;
    if (clientStatsResult?.success) clientStats = clientStatsResult.stats;
    if (projectStatsResult?.success) projectStats = projectStatsResult.stats;
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
  }

  // Use fallback values if stats are missing
  if (!tenderStats)
    tenderStats = {
      totalValue: 0,
      winRate: 0,
      trends: { value: 0, winRate: 0 },
      upcomingDeadlines: 0,
      totalTenders: 0,
      statusCounts: { open: 0, closed: 0, evaluation: 0, awarded: 0, lost: 0 },
      overdueCount: 0,
    };
  if (!clientStats)
    clientStats = {
      clientsWithContact: 0,
      totalClients: 0,
    };
  if (!projectStats)
    projectStats = {
      totalProjects: 0,
      growth: 0,
      activePOs: 0,
      totalPOAmount: 0,
    };

  return (
    <>
      {/* Primary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Pipeline Value"
          value={formatCurrency(tenderStats.totalValue)}
          description="Combined value of all tenders"
          icon={<Banknote className="h-4 w-4" />}
          trend={{
            value: tenderStats.trends?.value || 0,
            isPositive: (tenderStats.trends?.value || 0) >= 0,
          }}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercentage(tenderStats.winRate)}
          description="Percentage of won tenders"
          icon={<Target className="h-4 w-4" />}
          trend={{
            value: tenderStats.trends?.winRate || 0,
            isPositive: (tenderStats.trends?.winRate || 0) >= 0,
          }}
        />
        <MetricCard
          title="Active Projects"
          value={formatNumber(projectStats.totalProjects)}
          description="Currently active projects"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            value: projectStats.growth,
            isPositive: projectStats.growth >= 0,
          }}
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={formatNumber(tenderStats.upcomingDeadlines)}
          description="Due in next 30 days"
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tenders"
          value={formatNumber(tenderStats.totalTenders)}
          description={`${tenderStats.statusCounts.open} open, ${tenderStats.statusCounts.evaluation} in evaluation`}
        />
        <MetricCard
          title="Client Engagement"
          value={`${clientStats.clientsWithContact}/${clientStats.totalClients}`}
          description="Clients with complete contact info"
        />
        <MetricCard
          title="Purchase Orders"
          value={formatNumber(projectStats.activePOs)}
          description={`Total: ${formatCurrency(projectStats.totalPOAmount)}`}
        />
        <MetricCard
          title="Under Evaluation"
          value={formatNumber(tenderStats.statusCounts.evaluation)}
          description="Tenders currently under evaluation"
        />
      </div>
    </>
  );
}
