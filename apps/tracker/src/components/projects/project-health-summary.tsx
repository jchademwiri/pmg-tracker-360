'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, HeartPulse, Truck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ProjectHealthSummaryStats {
  /** Projects with high/critical open risks */
  criticalProjects: number;
  /** POs past their expected delivery date */
  overdueDeliveries: number;
  /** POs with open/sent status (pending delivery) */
  pendingDeliveries: number;
  /** Total active (open) risks across all projects */
  openRisks: number;
}

interface ProjectHealthSummaryProps {
  stats: ProjectHealthSummaryStats;
}

const healthItems = [
  {
    key: 'criticalProjects' as const,
    label: 'At-Risk Projects',
    description: 'Active projects with high or critical risks',
    icon: HeartPulse,
    color: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    link: '/projects?status=active',
  },
  {
    key: 'overdueDeliveries' as const,
    label: 'Overdue Deliveries',
    description: 'Purchase orders past expected delivery date',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    link: '/projects/purchase-orders',
  },
  {
    key: 'pendingDeliveries' as const,
    label: 'Pending Deliveries',
    description: 'Open or sent purchase orders awaiting receipt',
    icon: Truck,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    link: '/projects/purchase-orders?status=open',
  },
  {
    key: 'openRisks' as const,
    label: 'Open Risks',
    description: 'Active delivery risks across all projects',
    icon: ShieldAlert,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    link: '/projects',
  },
];

export function ProjectHealthSummary({ stats }: ProjectHealthSummaryProps) {
  const totalAttention = Object.values(stats).reduce((sum, val) => sum + val, 0);

  if (totalAttention === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 mb-2">
            <span className="text-lg">✓</span>
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            All projects are in good shape
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            No items need your attention right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-red-500" />
          Project Health Summary — {totalAttention} item{totalAttention !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {healthItems.map((item) => {
            const count = stats[item.key];
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.link}
                className={`${item.border} ${item.bg} rounded-lg border p-3 transition-all hover:shadow-sm hover:opacity-80 ${count === 0 ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className={`text-lg font-bold ${item.color}`}>{count}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
