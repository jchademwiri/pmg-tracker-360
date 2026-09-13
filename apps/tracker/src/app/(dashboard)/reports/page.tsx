import Link from "next/link";
import { FileDown, ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/server";
import { getReportStats, getTenderSubmissionTrend } from "@/server/reports";
import { ReportStatsCards } from "@/components/reports/stats-cards";
import { TenderPerformanceChart } from "@/components/reports/tender-performance-chart";
import { TenderSubmissionTrendChart } from "@/components/reports/tender-submission-trend-chart";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view reports.
          </p>
        </div>
      </div>
    );
  }

  const [result, trendResult] = await Promise.all([
    getReportStats(session.activeOrganizationId),
    getTenderSubmissionTrend(session.activeOrganizationId),
  ]);
  const stats = result.stats;
  const trendData = trendResult.success ? trendResult.data : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze your tender performance and project metrics.
          </p>
        </div>

        <Button asChild className="gap-2 shrink-0 shadow-sm">
          <Link href="/downloads">
            <FileDown className="h-4 w-4" />
            <span>Download Center</span>
          </Link>
        </Button>
      </header>

      <ReportStatsCards stats={stats} />

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
        <TenderSubmissionTrendChart data={trendData} />
      </div>

      <Card className="border-white/10 bg-gradient-to-r from-primary/5 via-card/50 to-primary/5 shadow-md">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Looking for Downloadable Reports?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Official Master Tender Registers, Management Follow-Up Reports, Client Dossiers, and Win/Loss Summaries have moved to the dedicated Download Center.
            </p>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link href="/downloads">
              <span>Go to Download Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
