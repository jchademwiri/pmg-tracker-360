import { FileSpreadsheet, Trophy } from 'lucide-react';

import { getCurrentUser } from '@/server';
import { getReportStats } from '@/server/reports';
import { ReportStatsCards } from '@/components/reports/stats-cards';
import { TenderPerformanceChart } from '@/components/reports/tender-performance-chart';
import { RevenueForecastChart } from '@/components/reports/revenue-forecast-chart';
import { TenderWinLossPdfButton } from '@/components/reports/tender-winloss-pdf-button';
import { TenderRegisterCsvButton } from '@/components/reports/tender-register-csv-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

      {/* Downloadable Reports */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Downloadable Reports</h2>
          <p className="text-sm text-muted-foreground">
            Export tender data for record-keeping, review, and analysis.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-lg">Tender Register</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                Every tender with client, status, priority, dates, and value — as a CSV for
                spreadsheet review or record-keeping.
              </CardDescription>
              <TenderRegisterCsvButton />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-lg">Win/Loss Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>
                Win rate, awarded and lost tenders, and loss reasons — a formal PDF for
                performance review.
              </CardDescription>
              <TenderWinLossPdfButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
