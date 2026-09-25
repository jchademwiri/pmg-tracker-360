import Link from "next/link";
import {
  FileSpreadsheet,
  Users,
  Trophy,
  CalendarClock,
  FileDown,
  BarChart3,
  ArrowRight,
} from "lucide-react";

import { getCurrentUser, getClientsList } from "@/server";
import { TenderWinLossPdfButton } from "@/components/reports/tender-winloss-pdf-button";
import { TenderFollowUpButton } from "@/components/reports/tender-follow-up-button";
import {
  TenderRegisterButtons,
  ClientTenderReportButtons,
} from "@/components/reports/tender-register-excel-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view downloadable reports.
          </p>
        </div>
      </div>
    );
  }

  const clientsResult = await getClientsList(session.activeOrganizationId);
  const clients = clientsResult.clients;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileDown className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Downloads & Exports
            </h1>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            Generate and export official tender registers, management
            follow-ups, and client reports in PDF and Excel.
          </p>
        </div>

        <Button variant="outline" asChild className="gap-2 shrink-0">
          <Link href="/reports">
            <BarChart3 className="h-4 w-4" />
            <span>Reports & Insights</span>
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Tender Register */}
        <Card className="transition-shadow hover:shadow-md border-white/10 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/30">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Tender Register</CardTitle>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Excel & PDF Available
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardDescription className="text-sm leading-relaxed">
              Full portfolio master register with structured summary KPIs,
              submission timing, and dedicated sheets for every active client.
            </CardDescription>
            <TenderRegisterButtons />
          </CardContent>
        </Card>

        {/* Management Follow-Up Report */}
        <Card className="transition-shadow hover:shadow-md border-white/10 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2.5 dark:bg-indigo-900/30">
                <CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Management Follow-Up Report
                </CardTitle>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Executive PDF
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              Executive summary with tender numbers, descriptions, closing
              dates, direct client contact details, and offer validity expiry
              tracking for management action.
            </CardDescription>
            <TenderFollowUpButton />
          </CardContent>
        </Card>

        {/* Client Tender Report */}
        <Card className="transition-shadow hover:shadow-md border-white/10 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Client Tender Report</CardTitle>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Filtered by Client • Excel & PDF
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              Select a specific client to download their filtered tender dossier
              including dates, client contacts, submission timing, and estimated
              values.
            </CardDescription>
            <ClientTenderReportButtons clients={clients} />
          </CardContent>
        </Card>

        {/* Win/Loss Summary */}
        <Card className="transition-shadow hover:shadow-md border-white/10 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Win/Loss Summary</CardTitle>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Formal Review PDF
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              Win rate analysis, won and lost tenders, and categorized loss
              reasons — a clean document prepared for stakeholder reviews and
              strategy meetings.
            </CardDescription>
            <TenderWinLossPdfButton />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-white/10 bg-muted/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">
            Need interactive analytics and charts?
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            View live win/loss rates, monthly submission trends, and pipeline
            metrics on the Reports & Insights dashboard.
          </p>
        </div>
        <Button variant="secondary" asChild className="shrink-0 gap-2">
          <Link href="/reports">
            <span>View Reports & Insights</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
