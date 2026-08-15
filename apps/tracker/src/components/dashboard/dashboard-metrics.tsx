import Link from 'next/link';
import {
  CalendarDays,
  CalendarRange,
  Hourglass,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck2,
  ChevronRight,
} from 'lucide-react';
import { getTenderStats } from '@/server/tenders';
import { formatNumber } from '@/lib/dashboard-data';

interface DashboardMetricsProps {
  organizationId: string;
}

export async function DashboardMetrics({
  organizationId,
}: DashboardMetricsProps) {
  let tenderStats: {
    submittedThisMonth: number;
    submittedThisYear: number;
    expiredValidityUncontactedCount: number;
    underEvaluationCount: number;
    totalTenders: number;
    upcomingDeadlines: number;
  } = {
    submittedThisMonth: 0,
    submittedThisYear: 0,
    expiredValidityUncontactedCount: 0,
    underEvaluationCount: 0,
    totalTenders: 0,
    upcomingDeadlines: 0,
  };

  try {
    const res = await getTenderStats(organizationId);
    if (res?.success && res.stats) {
      tenderStats = {
        submittedThisMonth: res.stats.submittedThisMonth ?? 0,
        submittedThisYear: res.stats.submittedThisYear ?? 0,
        expiredValidityUncontactedCount:
          res.stats.expiredValidityUncontactedCount ?? 0,
        underEvaluationCount:
          res.stats.underEvaluationCount ??
          res.stats.statusCounts?.evaluation ??
          0,
        totalTenders: res.stats.totalTenders ?? 0,
        upcomingDeadlines: res.stats.upcomingDeadlines ?? 0,
      };
    }
  } catch (error) {
    console.error('Failed to fetch tender mission metrics:', error);
  }

  const currentMonthName = new Intl.DateTimeFormat('en-ZA', { month: 'short' }).format(new Date());
  const currentYear = new Date().getFullYear();

  const cards = [
    {
      id: 'mtd',
      title: 'Submitted This Month',
      value: tenderStats.submittedThisMonth,
      subtext: `${currentMonthName} 1st to today`,
      href: '/tenders?submitted=this-month',
      icon: CalendarDays,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      cardBg: 'bg-card/75 hover:bg-card/95 hover:border-sky-500/40',
      ctaText: 'View Month Submissions',
      isUrgent: false,
    },
    {
      id: 'ytd',
      title: 'Submitted This Year',
      value: tenderStats.submittedThisYear,
      subtext: `${currentYear} cumulative YTD`,
      href: '/tenders?submitted=this-year',
      icon: CalendarRange,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      cardBg: 'bg-card/75 hover:bg-card/95 hover:border-emerald-500/40',
      ctaText: 'View 2026 Submissions',
      isUrgent: false,
    },
    {
      id: 'validity-expired',
      title: 'Expired Validity (No Follow-up)',
      value: tenderStats.expiredValidityUncontactedCount,
      subtext: 'Lapsed period with no communication',
      href: '/tenders?filter=validity-expired-uncontacted',
      icon: Hourglass,
      iconColor: tenderStats.expiredValidityUncontactedCount > 0 ? 'text-amber-400' : 'text-muted-foreground',
      iconBg: tenderStats.expiredValidityUncontactedCount > 0 ? 'bg-amber-500/15 border-amber-500/30' : 'bg-muted/20 border-border/50',
      cardBg:
        tenderStats.expiredValidityUncontactedCount > 0
          ? 'bg-amber-950/15 border-amber-500/40 hover:bg-amber-950/25 hover:border-amber-400 shadow-md shadow-amber-950/20'
          : 'bg-card/75 hover:bg-card/95 hover:border-border/80',
      ctaText: tenderStats.expiredValidityUncontactedCount > 0 ? 'Take Action Now' : 'All Validities Followed Up',
      isUrgent: tenderStats.expiredValidityUncontactedCount > 0,
    },
    {
      id: 'evaluation',
      title: 'Under Evaluation',
      value: tenderStats.underEvaluationCount,
      subtext: 'Awaiting client / SCM outcome',
      href: '/tenders?status=evaluation',
      icon: FileCheck2,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10 border-primary/20',
      cardBg: 'bg-card/75 hover:bg-card/95 hover:border-primary/40',
      ctaText: 'View Active Pipeline',
      isUrgent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            href={card.href}
            className={`group relative rounded-3xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer shadow-xs hover:scale-[1.01] hover:shadow-lg ${card.cardBg}`}
          >
            {card.isUrgent && (
              <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-950 text-[10px] font-extrabold tracking-wider uppercase shadow-xs flex items-center gap-1 animate-pulse">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>Action Required</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.iconBg} ${card.iconColor} transition-transform group-hover:scale-110`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono tracking-tight tabular-nums">
                  {formatNumber(card.value)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtext}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              <span className={card.isUrgent ? 'text-amber-400 font-bold' : ''}>
                {card.ctaText}
              </span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
