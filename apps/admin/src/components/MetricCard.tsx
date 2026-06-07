import type { ReactNode } from 'react';

type Variant = 'primary' | 'success' | 'warning' | 'danger';

type VariantClasses = {
  iconBg: string;
  iconBorder: string;
  countColor: string;
};

const VARIANT_MAP: Record<Variant, VariantClasses> = {
  primary: {
    iconBg: 'bg-indigo-500/10',
    iconBorder: 'border-indigo-500/20',
    countColor: 'text-indigo-400',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    countColor: 'text-emerald-400',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/20',
    countColor: 'text-amber-400',
  },
  danger: {
    iconBg: 'bg-red-500/10',
    iconBorder: 'border-red-500/20',
    countColor: 'text-red-400',
  },
};

type MetricCardProps = {
  label: string;
  count: number | string;
  icon: ReactNode;
  variant: Variant;
  secondaryNote?: string;
};

export default function MetricCard({
  label,
  count,
  icon,
  variant,
  secondaryNote,
}: MetricCardProps) {
  const { iconBg, iconBorder, countColor } = VARIANT_MAP[variant];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${countColor}`}>{count}</p>
        {secondaryNote && (
          <p className="text-xs text-zinc-500">{secondaryNote}</p>
        )}
      </div>
      <div
        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border ${iconBg} ${iconBorder}`}
      >
        {icon}
      </div>
    </div>
  );
}
