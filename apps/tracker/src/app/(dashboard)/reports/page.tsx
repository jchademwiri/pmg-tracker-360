import { FileSpreadsheet, Users, Trophy } from 'lucide-react';

import { getCurrentUser, getClientsList, getReportStats } from '@/server';
import { ReportStatsCards } from '@/components/reports/stats-cards';
import { TenderPerformanceChart } from '@/components/reports/tender-performance-chart';
import { RevenueForecastChart } from '@/components/reports/revenue-forecast-chart';
import { TenderWinLossPdfButton } from '@/components/reports/tender-winloss-pdf-button';
import { TenderRegisterExcelButton, ClientTenderExcelButton } from '@/components/reports/tender-register-excel-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to view reports.</p>
        </div>
      </div>
    );
  }

  const [result, clientsResult] = await Promise.all([
    getReportStats(session.activeOrganizationId),
    getClientsList(session.activeOrganizationId),
  ]);
  const stats = result.stats;
  const clients = clientsResult.clients;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Insights</h1>
        <p className="text-muted-foreground">Analyze your tender performance and project metrics.</p>
      </header>

      <ReportStatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <TenderPerformanceChart stats={{ wonTenders: stats.wonTenders, lostTenders: stats.lostTenders, pendingTenders: stats.pendingTenders, winRate: stats.winRate, totalTenders: stats.totalTenders }} />
        <RevenueForecastChart stats={{ pipelineValue: stats.pipelineValue, totalWonValue: stats.totalWonValue, poRevenue: stats.poRevenue, pendingTenders: stats.pendingTenders }} />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Downloadable Reports</h2>
          <p className="text-sm text-muted-foreground">Export polished Excel workbooks for management, record-keeping, and client-level reporting.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/20"><FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                <CardTitle className="text-lg">Tender Register Workbook</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>Full tender register with Contents, Summary, live submission timing, data-quality checks, and a dedicated sheet for every client.</CardDescription>
              <TenderRegisterExcelButton />
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20"><Users className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                <CardTitle className="text-lg">Client Tender Report</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>Select a client and download a focused Excel report containing that client’s tenders, dates, contacts, submission timing, and estimated values.</CardDescription>
              <ClientTenderExcelButton clients={clients} />
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/20"><Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                <CardTitle className="text-lg">Win/Loss Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>Win rate, awarded and lost tenders, and loss reasons — a formal PDF for performance review.</CardDescription>
              <TenderWinLossPdfButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
