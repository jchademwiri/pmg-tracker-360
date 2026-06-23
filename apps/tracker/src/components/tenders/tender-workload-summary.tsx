'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileWarning, UserX, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import type { WorkloadStats } from '@/server/tender-workload';

interface TenderWorkloadSummaryProps {
  stats: WorkloadStats;
}

const workloadItems = [
  {
    key: 'missingDocuments' as const,
    label: 'Missing Documents',
    description: 'Active tenders without uploaded documents',
    icon: FileWarning,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    link: '/tenders?status=open',
  },
  {
    key: 'missingContact' as const,
    label: 'Missing Contact',
    description: 'No contact info on tender or client',
    icon: UserX,
    color: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    link: '/tenders?status=open',
  },
  {
    key: 'overdueActions' as const,
    label: 'Overdue Actions',
    description: 'Past submission date, still active',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    link: '/tenders?status=open',
  },
  {
    key: 'awaitingResults' as const,
    label: 'Awaiting Results',
    description: 'Submitted or under evaluation',
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    link: '/tenders?status=awaiting_results',
  },
];

export function TenderWorkloadSummary({ stats }: TenderWorkloadSummaryProps) {
  const totalAttention = Object.values(stats).reduce((sum, val) => sum + val, 0);

  if (totalAttention === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 mb-2">
            <span className="text-lg">✓</span>
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            All tenders are in good shape
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
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Needs Attention — {totalAttention} item{totalAttention !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {workloadItems.map((item) => {
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
