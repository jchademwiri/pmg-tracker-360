import { cn } from '@/lib/utils';

export type StatusDomain =
  | 'tender'
  | 'project'
  | 'purchaseOrder'
  | 'delivery'
  | 'risk'
  | 'member';

export type StatusConfig = {
  label: string;
  className: string;
  order?: number;
  domain?: StatusDomain;
};

const tone = {
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  review: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
  done: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
};

export const TENDER_LIFECYCLE = [
  'new',
  'review',
  'approved_to_prepare',
  'preparation',
  'ready',
  'submitted',
  'evaluation',
  'awarded',
] as const;

export const PO_LIFECYCLE = [
  'open',
  'sent',
  'partially_delivered',
  'delivered',
  'completed',
] as const;

export const STATUS_MAP_BY_DOMAIN: Record<StatusDomain, Record<string, StatusConfig>> = {
  tender: {
    new: { label: 'Opportunity', className: tone.info, domain: 'tender', order: 0 },
    review: { label: 'Review', className: tone.review, domain: 'tender', order: 1 },
    approved_to_prepare: {
      label: 'Approved to Prepare',
      className: tone.progress,
      domain: 'tender',
      order: 2,
    },
    preparation: {
      label: 'Preparing',
      className: tone.warning,
      domain: 'tender',
      order: 3,
    },
    ready: {
      label: 'Ready',
      className: tone.success,
      domain: 'tender',
      order: 4,
    },
    submitted: {
      label: 'Submitted',
      className: tone.progress,
      domain: 'tender',
      order: 5,
    },
    evaluation: {
      label: 'Evaluation',
      className: tone.progress,
      domain: 'tender',
      order: 6,
    },
    awarded: {
      label: 'Awarded',
      className: tone.warning,
      domain: 'tender',
      order: 7,
    },
    lost: { label: 'Lost / Rejected', className: tone.danger, domain: 'tender' },
    closed: { label: 'Closed', className: tone.done, domain: 'tender' },
    cancelled: { label: 'Cancelled', className: tone.done, domain: 'tender' },
  },
  project: {
    active: { label: 'Active', className: tone.success, domain: 'project' },
    completed: { label: 'Closed Out', className: tone.success, domain: 'project' },
    cancelled: { label: 'Cancelled', className: tone.done, domain: 'project' },
    not_ordered: { label: 'Not Ordered', className: tone.neutral, domain: 'project' },
    ordered: { label: 'Ordered', className: tone.progress, domain: 'project' },
    fully_ordered: { label: 'Fully Ordered', className: tone.progress, domain: 'project' },
    partially_delivered: { label: 'Partially Delivered', className: tone.warning, domain: 'project' },
    fully_delivered: { label: 'Fully Delivered', className: tone.success, domain: 'project' },
  },
  purchaseOrder: {
    open: { label: 'Open', className: tone.success, domain: 'purchaseOrder', order: 0 },
    sent: { label: 'Sent', className: tone.progress, domain: 'purchaseOrder', order: 1 },
    partially_delivered: {
      label: 'Partially Delivered',
      className: tone.warning,
      domain: 'purchaseOrder',
      order: 2,
    },
    delivered: {
      label: 'Delivered',
      className: tone.success,
      domain: 'purchaseOrder',
      order: 3,
    },
    completed: {
      label: 'Completed',
      className: tone.success,
      domain: 'purchaseOrder',
      order: 4,
    },
    cancelled: { label: 'Cancelled', className: tone.done, domain: 'purchaseOrder' },
    disputed: { label: 'Disputed', className: tone.danger, domain: 'purchaseOrder' },
  },
  delivery: {
    received: { label: 'Received', className: tone.neutral, domain: 'delivery' },
    verified: { label: 'Verified', className: tone.success, domain: 'delivery' },
    disputed: { label: 'Disputed', className: tone.danger, domain: 'delivery' },
  },
  risk: {
    low: { label: 'Low Risk', className: tone.success, domain: 'risk' },
    medium: { label: 'Medium Risk', className: tone.warning, domain: 'risk' },
    high: { label: 'High Risk', className: tone.danger, domain: 'risk' },
    critical: { label: 'Critical Risk', className: tone.danger, domain: 'risk' },
    mitigated: { label: 'Mitigated', className: tone.progress, domain: 'risk' },
  },
  member: {
    pending: { label: 'Pending', className: tone.warning, domain: 'member' },
    accepted: { label: 'Accepted', className: tone.success, domain: 'member' },
  },
};

// Generate flat map for backward compatibility
export const STATUS_MAP: Record<string, StatusConfig> = {};
for (const domain of Object.keys(STATUS_MAP_BY_DOMAIN) as StatusDomain[]) {
  const domainMap = STATUS_MAP_BY_DOMAIN[domain];
  for (const status of Object.keys(domainMap)) {
    if (!STATUS_MAP[status]) {
      STATUS_MAP[status] = domainMap[status];
    }
  }
}

const FALLBACK: StatusConfig = {
  label: 'Unknown',
  className: tone.neutral,
};

function humanizeStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getStatusConfig(status: string, domain?: StatusDomain): StatusConfig {
  if (domain && STATUS_MAP_BY_DOMAIN[domain]?.[status]) {
    return STATUS_MAP_BY_DOMAIN[domain][status];
  }
  return STATUS_MAP[status] ?? { ...FALLBACK, label: humanizeStatus(status) };
}

interface StatusBadgeProps {
  status: string;
  domain?: StatusDomain;
  className?: string;
}

export function StatusBadge({ status, domain, className }: StatusBadgeProps) {
  const config = getStatusConfig(status, domain);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

