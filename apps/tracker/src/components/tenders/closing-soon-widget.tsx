'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flame, Link2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

interface ClosingSoonTender {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  status: string;
  value: string | null;
  daysUntilDeadline: number | null;
  client: {
    name: string;
  } | null;
}

interface ClosingSoonWidgetProps {
  tenders: ClosingSoonTender[];
  className?: string;
}

function getUrgencyLevel(days: number | null): {
  label: string;
  className: string;
  pulse: boolean;
} {
  if (days === null) return { label: 'No date', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', pulse: false };
  if (days === 0) return { label: 'Due today', className: 'bg-red-500/15 text-red-400 border-red-500/30', pulse: true };
  if (days === 1) return { label: 'Tomorrow', className: 'bg-red-500/10 text-red-400 border-red-500/20', pulse: true };
  if (days <= 3) return { label: `${days} days`, className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', pulse: false };
  return { label: `${days} days`, className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', pulse: false };
}

export function ClosingSoonWidget({ tenders, className = '' }: ClosingSoonWidgetProps) {
  // Server action already filters to 7-day window; sort by urgency
  const closingSoon = [...tenders]
    .sort((a, b) => (a.daysUntilDeadline ?? 999) - (b.daysUntilDeadline ?? 999));

  const hasUrgent = closingSoon.some((t) => (t.daysUntilDeadline ?? 999) <= 1);

  if (closingSoon.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Closing Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No tenders closing within the next 7 days
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Closing Soon
          <Badge variant="destructive" className="text-xs">
            {closingSoon.length}
          </Badge>
          {hasUrgent && (
            <Badge className="text-xs bg-red-600 hover:bg-red-600 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Urgent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {closingSoon.map((tender) => {
            const urgency = getUrgencyLevel(tender.daysUntilDeadline);
            return (
              <Link
                key={tender.id}
                href={`/tenders/${tender.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                        {tender.tenderNumber}
                      </span>
                      <Badge className={`text-[10px] border ${urgency.className} ${urgency.pulse ? 'animate-pulse' : ''}`}>
                        {urgency.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {tender.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {tender.client?.name || 'Unknown Client'}
                      </p>
                      {tender.value && (
                        <p className="text-xs font-medium">
                          {formatCurrency(tender.value)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-3 text-center">
          <Link
            href="/tenders?status=open"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all open tenders →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
