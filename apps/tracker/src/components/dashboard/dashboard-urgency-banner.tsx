import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  FileWarning,
  Truck,
} from 'lucide-react';
import { getDashboardUrgency } from '@/server/dashboard-urgency';

interface DashboardUrgencyBannerProps {
  organizationId: string;
}

export async function DashboardUrgencyBanner({
  organizationId,
}: DashboardUrgencyBannerProps) {
  const result = await getDashboardUrgency(organizationId);
  const urgency = result.urgency;

  // If nothing urgent, show a calm all-clear message
  const hasUrgency =
    urgency.overdueTenders > 0 ||
    urgency.closingThisWeek > 0 ||
    urgency.underEvaluation > 0 ||
    urgency.dueFollowUps > 0 ||
    urgency.missingDocuments > 0 ||
    urgency.overdueDeliveries > 0;

  if (!hasUrgency) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 shadow-sm animate-in fade-in duration-300">
        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          All clear — no urgent actions needed right now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 shadow-sm animate-in fade-in duration-300">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />

      {urgency.overdueTenders > 0 && (
        <Link
          href="/tenders?status=open"
          className="group inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
        >
          <Clock className="h-3 w-3" />
          {urgency.overdueTenders} overdue tender{urgency.overdueTenders !== 1 ? 's' : ''}
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}

      {urgency.closingThisWeek > 0 && (
        <Link
          href="/tenders?status=open"
          className="group inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
        >
          <FileText className="h-3 w-3" />
          {urgency.closingThisWeek} closing this week
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}

      {urgency.underEvaluation > 0 && (
        <Link
          href="/tenders?status=evaluation"
          className="group inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
        >
          <Clock className="h-3 w-3" />
          {urgency.underEvaluation} awaiting result{urgency.underEvaluation !== 1 ? 's' : ''}
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}

      {urgency.dueFollowUps > 0 && (
        <Link
          href="/tenders?status=open"
          className="group inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
        >
          <PhoneCall className="h-3 w-3" />
          {urgency.dueFollowUps} follow-up{urgency.dueFollowUps !== 1 ? 's' : ''} due
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}

      {urgency.missingDocuments > 0 && (
        <Link
          href="/tenders?status=open"
          className="group inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50"
        >
          <FileWarning className="h-3 w-3" />
          {urgency.missingDocuments} missing document{urgency.missingDocuments !== 1 ? 's' : ''}
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}

      {urgency.overdueDeliveries > 0 && (
        <Link
          href="/projects/purchase-orders"
          className="group inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
        >
          <Truck className="h-3 w-3" />
          {urgency.overdueDeliveries} overdue deliver{urgency.overdueDeliveries !== 1 ? 'ies' : 'y'}
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      )}

      <span className="text-xs text-muted-foreground ml-auto hidden lg:inline">
        {urgency.totalOpen} open tender{urgency.totalOpen !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
