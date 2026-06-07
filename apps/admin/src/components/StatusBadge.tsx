type StatusClasses = {
  bg: string;
  text: string;
  border: string;
};

const STATUS_MAP: Record<string, StatusClasses> = {
  open: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  in_progress: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  closed: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  active: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  deleted: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  suspicious: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  bug: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
  feature: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  other: {
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-400',
    border: 'border-zinc-700/40',
  },
};

const FALLBACK_CLASSES: StatusClasses = {
  bg: 'bg-zinc-800/60',
  text: 'text-zinc-400',
  border: 'border-zinc-700/40',
};

/**
 * Pure helper — exported for property-based testing.
 * Never throws; unknown statuses fall back to neutral zinc.
 * Uses Object.hasOwn to avoid prototype-key collisions (e.g. "toString").
 */
export function getStatusClasses(status: string): StatusClasses {
  return Object.hasOwn(STATUS_MAP, status) ? STATUS_MAP[status]! : FALLBACK_CLASSES;
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { bg, text, border } = getStatusClasses(status);

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${bg} ${text} ${border} ${className}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
