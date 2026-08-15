import { Suspense } from 'react';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardDeadlines } from '@/components/dashboard/dashboard-deadlines';
import { DashboardBriefings } from '@/components/dashboard/dashboard-briefings';
import { Skeleton } from '@/components/ui/skeleton';

interface SpecialistViewProps {
  organizationId: string;
}

export async function SpecialistView({ organizationId }: SpecialistViewProps) {
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

      {/* Deadlines & Briefings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[350px] rounded-3xl bg-card/50 border border-border/20" />}>
          <DashboardDeadlines organizationId={organizationId} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[350px] rounded-3xl bg-card/50 border border-border/20" />}>
          <DashboardBriefings organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  );
}
