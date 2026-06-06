import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { DashboardDeadlines } from '@/components/dashboard/dashboard-deadlines';
import { BarChart3, Users, CreditCard, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminViewProps {
  organizationId: string;
}

export async function AdminView({ organizationId }: AdminViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Primary KPI & Secondary Metrics */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
        }
      >
        <DashboardMetrics organizationId={organizationId} />
      </Suspense>

      {/* Admin Funnel & Quick Links Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Upcoming Deadlines Widget */}
        <div className="md:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px] rounded-xl bg-card/50 border border-border/20" />}>
            <DashboardDeadlines organizationId={organizationId} />
          </Suspense>
        </div>

        {/* Quick Navigation Hub */}
        <Card className="backdrop-blur-md bg-card/70 border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
            <CardDescription>Direct access to administrative modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/reports"
              className="group flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Reports & Analytics</div>
                  <div className="text-xs text-muted-foreground">View pipeline graphs</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/organization"
              className="group flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Manage Team</div>
                  <div className="text-xs text-muted-foreground">Roles & Members</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/billing"
              className="group flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-accent/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Billing & Invoices</div>
                  <div className="text-xs text-muted-foreground">Manage payment loops</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Distribution charts */}
      <Suspense fallback={<Skeleton className="h-[300px] rounded-xl" />}>
        <DashboardCharts organizationId={organizationId} />
      </Suspense>

    </div>
  );
}
