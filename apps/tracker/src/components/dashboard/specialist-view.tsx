import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { DashboardDeadlines } from '@/components/dashboard/dashboard-deadlines';
import { DashboardBriefings } from '@/components/dashboard/dashboard-briefings';
import { DashboardActivity } from '@/components/dashboard/dashboard-activity';

import { getSpecialistDashboardStats } from '@/server/dashboard';
import { FileText, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SpecialistViewProps {
  organizationId: string;
}

export async function SpecialistView({ organizationId }: SpecialistViewProps) {
  const statsResult = await getSpecialistDashboardStats(organizationId);
    const stats = statsResult.success
      ? statsResult.stats
      : {
          openCount: 0,
          evaluationCount: 0,
          validityWarningCount: 0,
          validityWarnings: [],
        };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Specialist Metrics Bar */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <MetricCard
          title="Open Tenders"
          value={stats.openCount}
          description="Awaiting submission"
          icon={<FileText className="h-4 w-4 text-emerald-500" />}
          className="border-emerald-500/10 hover:border-emerald-500/20 transition-all"
        />
        <MetricCard
          title="Under Evaluation"
          value={stats.evaluationCount}
          description="Submitted, awaiting outcome"
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          className="border-blue-500/10 hover:border-blue-500/20 transition-all"
        />
        <MetricCard
          title="Validity Warnings"
          value={stats.validityWarningCount}
          description="Expiring in next 14 days"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          className="border-amber-500/10 hover:border-amber-500/20 transition-all"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Deadlines & Briefings (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines Widget */}
          <Suspense fallback={<Skeleton className="h-[350px] rounded-xl bg-card/50 border border-border/20" />}>
            <DashboardDeadlines organizationId={organizationId} />
          </Suspense>

          {/* Upcoming Briefings Widget */}
          <Suspense fallback={<Skeleton className="h-[350px] rounded-xl bg-card/50 border border-border/20" />}>
            <DashboardBriefings organizationId={organizationId} />
          </Suspense>
        </div>

        {/* Right Side: Expiry Warnings */}
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-[320px] rounded-xl bg-card/50 border border-border/20" />}>
            <DashboardActivity organizationId={organizationId} />
          </Suspense>

          {/* Validity Expiry Approaching List */}
          <Card className="backdrop-blur-md bg-card/70 border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Validity Expiries
              </CardTitle>
              <CardDescription>Bids whose validity periods end within 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.validityWarnings.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No validity expiries approaching
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.validityWarnings.map((warn) => (
                    <Link
                      key={warn.id}
                      href={`/tenders/${warn.id}`}
                      className="block p-3 rounded-lg border bg-background/50 hover:bg-accent/40 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-blue-600">
                          {warn.tenderNumber.toUpperCase()}
                        </span>
                        <Badge variant="destructive" className="text-[10px] uppercase">
                          Expiring
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expiry Date: <span className="font-medium text-foreground">{formatDate(warn.evaluationDate)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
