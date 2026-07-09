import { getCurrentUser } from '@/server';
import { getReportStats } from '@/server/reports';
import { ReportStatsCards } from '@/components/reports/stats-cards';
import { TenderPerformanceChart } from '@/components/reports/tender-performance-chart';
import { RevenueForecastChart } from '@/components/reports/revenue-forecast-chart';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view reports.
          </p>
        </div>
      </div>
    );
  }

  const result = await getReportStats(session.activeOrganizationId);
  const stats = result.stats;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Insights
        </h1>
        <p className="text-muted-foreground">
          Analyze your tender performance and project metrics.
        </p>
      </header>

      {/* Overview Stats */}
      <ReportStatsCards stats={stats} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <TenderPerformanceChart
          stats={{
            wonTenders: stats.wonTenders,
            lostTenders: stats.lostTenders,
            pendingTenders: stats.pendingTenders,
            winRate: stats.winRate,
            totalTenders: stats.totalTenders,
          }}
        />
        <RevenueForecastChart
          stats={{
            pipelineValue: stats.pipelineValue,
            totalWonValue: stats.totalWonValue,
            poRevenue: stats.poRevenue,
            pendingTenders: stats.pendingTenders,
          }}
        />
      </div>
    </div>
  );
}
