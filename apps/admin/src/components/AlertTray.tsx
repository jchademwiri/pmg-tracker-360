import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type Alert = {
  id: string;
  label: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  href: string;
};

type AlertTrayProps = {
  alerts: Alert[];
};

type SeverityClasses = {
  bg: string;
  border: string;
  text: string;
};

const SEVERITY_MAP: Record<Alert['severity'], SeverityClasses> = {
  critical: {
    bg: 'bg-red-950/60',
    border: 'border-red-800/60',
    text: 'text-red-400',
  },
  high: {
    bg: 'bg-orange-950/60',
    border: 'border-orange-800/60',
    text: 'text-orange-400',
  },
  medium: {
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-800/60',
    text: 'text-yellow-400',
  },
  low: {
    bg: 'bg-blue-950/60',
    border: 'border-blue-800/60',
    text: 'text-blue-400',
  },
};

const SEVERITY_ORDER: Record<Alert['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Pure helper — exported for property-based testing.
 * Filters to alerts with count > 0 and sorts critical → high → medium → low.
 */
export function filterAndSortAlerts(alerts: Alert[]): Alert[] {
  return alerts
    .filter((a) => a.count > 0)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function SeverityIcon({
  severity,
  className,
}: {
  severity: Alert['severity'];
  className?: string;
}) {
  if (severity === 'critical' || severity === 'high') {
    return <AlertTriangle size={16} className={className} />;
  }
  if (severity === 'medium') {
    return <AlertCircle size={16} className={className} />;
  }
  return <Info size={16} className={className} />;
}

export default function AlertTray({ alerts }: AlertTrayProps) {
  const visible = filterAndSortAlerts(alerts);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((alert) => {
        const { bg, border, text } = SEVERITY_MAP[alert.severity];
        return (
          <a
            key={alert.id}
            href={alert.href}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border ${bg} ${border} ${text} hover:opacity-90 transition-opacity`}
          >
            <SeverityIcon severity={alert.severity} className={text} />
            <span
              className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 shrink-0 border ${bg} ${border} ${text}`}
            >
              {alert.count}
            </span>
            <span className="text-sm font-medium flex-1">{alert.label}</span>
          </a>
        );
      })}
    </div>
  );
}
