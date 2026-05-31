import { getCurrentUser } from '@/server';
import { getReportStats } from '@/server/reports';
import { ReportStatsCards } from '@/components/reports/stats-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

      {/* Future Charts Placeholder - MVP only requires cards for now */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tender Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              Detailed performance charts coming soon
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              Revenue forecast charts coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
