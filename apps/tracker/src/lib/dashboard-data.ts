import {
  getTenderStats,
  getRecentActivity,
  getUpcomingDeadlines,
} from '@/server/tenders';
import { getClientStats } from '@/server/clients';
import { getProjectStats } from '@/server/projects';

export interface ActivityItem {
  id: string;
  type: 'tender_created' | 'status_updated';
  description: string;
  timestamp: Date;
}

export interface DashboardData {
  tenderStats: Awaited<ReturnType<typeof getTenderStats>>['stats'];
  clientStats: Awaited<ReturnType<typeof getClientStats>>['stats'];
  projectStats: Awaited<ReturnType<typeof getProjectStats>>['stats'];
  recentActivity: ActivityItem[];
  upcomingDeadlines: Awaited<
    ReturnType<typeof getUpcomingDeadlines>
  >['deadlines'];
}

export async function getDashboardData(
  organizationId: string
): Promise<DashboardData> {
  try {
    const [
      tenderStatsResult,
      clientStatsResult,
      projectStatsResult,
      recentActivityResult,
      upcomingDeadlinesResult,
    ] = await Promise.all([
      getTenderStats(organizationId),
      getClientStats(organizationId),
      getProjectStats(organizationId),
      getRecentActivity(organizationId, 10),
      getUpcomingDeadlines(organizationId, 10),
    ]);

    const activityData = recentActivityResult.activity;
    const recentActivity: ActivityItem[] = [
      ...activityData.recentTenders.map((t) => ({
        id: `create-${t.id}`,
        type: 'tender_created' as const,
        description: `New tender ${t.tenderNumber.toUpperCase()}`,
        timestamp: t.createdAt,
      })),
      ...activityData.recentChanges.map((t) => ({
        id: `update-${t.id}`,
        type: 'status_updated' as const,
        description: `Tender ${t.tenderNumber.toUpperCase()} updated to ${t.status}`,
        timestamp: t.updatedAt || t.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      tenderStats: tenderStatsResult.stats,
      clientStats: clientStatsResult.stats,
      projectStats: projectStatsResult.stats,
      recentActivity,
      upcomingDeadlines: upcomingDeadlinesResult.deadlines,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

// Re-export formatters for backward compatibility
export * from '@/lib/format';

// Chart data formatters
export function getTenderStatusChartData(
  tenderStats: DashboardData['tenderStats']
) {
  return [
    { name: 'Open', value: tenderStats.statusCounts.open, fill: '#10b981' }, // green
    { name: 'Closed', value: tenderStats.statusCounts.closed, fill: '#6b7280' }, // gray
    { name: 'Evaluation', value: tenderStats.statusCounts.evaluation, fill: '#3b82f6' }, // blue
    { name: 'Awarded', value: tenderStats.statusCounts.awarded, fill: '#f59e0b' }, // amber
    { name: 'Lost', value: tenderStats.statusCounts.lost, fill: '#ef4444' }, // red
  ].filter((item) => item.value > 0);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMonthlyTrendsData(
  tenderStats: DashboardData['tenderStats']
) {
  // This would typically fetch historical data from the database
  // For now, we'll create sample data based on current stats
  const currentMonth = new Date();
  const months: { month: string; tenders: number; value: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - i,
      1
    );
    // Sample data removed for production readiness
    // months.push({
    //   month: date.toLocaleDateString('en-US', { month: 'short' }),
    //   tenders: Math.floor(Math.random() * 20) + 5, // Sample data
    //   value: Math.floor(Math.random() * 100000) + 20000, // Sample data
    // });
  }

  return months;
}
