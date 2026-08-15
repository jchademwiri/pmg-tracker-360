import { Suspense } from 'react';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardDeadlines } from '@/components/dashboard/dashboard-deadlines';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminViewProps {
  organizationId: string;
}

export async function AdminView({ organizationId }: AdminViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Core Tender Administrator Mission Cards */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-3xl" />
            ))}
          </div>
        }
      >
        <DashboardMetrics organizationId={organizationId} />
      </Suspense>

      {/* Actionable Deadlines, Briefings & Follow-Ups Stream */}
      <div className="w-full">
        <Suspense fallback={<Skeleton className="h-[400px] rounded-3xl bg-card/50 border border-border/20" />}>
          <DashboardDeadlines organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  );
}
