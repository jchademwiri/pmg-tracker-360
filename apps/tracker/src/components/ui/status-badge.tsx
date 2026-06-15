import { cn } from '@/lib/utils';

type StatusConfig = {
  label: string;
  className: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  // Tender statuses
  new: {
    label: 'New Opportunity',
    className: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  },
  review: {
    label: 'To Review',
    className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  },
  approved_to_prepare: {
    label: 'Approved to Prepare',
    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  },
  preparation: {
    label: 'In Preparation',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  ready: {
    label: 'Ready for Submission',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  },
  open: {
    label: 'Open',
    className: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  closed: {
    label: 'Closed',
    className: 'bg-zinc-800 text-zinc-400 border border-zinc-700/30',
  },
  evaluation: {
    label: 'Evaluation',
    className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  },
  awarded: {
    label: 'Appointed / Awarded',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  lost: {
    label: 'Rejected / Lost',
    className: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  },
  // PO statuses
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  partially_delivered: {
    label: 'Partially Delivered',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  disputed: {
    label: 'Disputed',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  // Project statuses
  active: {
    label: 'Active',
    className: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  // Member statuses
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
};

const FALLBACK: StatusConfig = {
  label: 'Unknown',
  className: 'bg-zinc-800 text-zinc-400 border border-zinc-700/30',
};

function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status] ?? { ...FALLBACK, label: status };
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

// Export for testing
export { STATUS_MAP, getStatusConfig };
