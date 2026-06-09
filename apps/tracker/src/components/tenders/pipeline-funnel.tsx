'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface PipelineFunnelProps {
  statusCounts: {
    open: number;
    closed: number;
    evaluation: number;
    awarded: number;
    lost: number;
  };
  className?: string;
}

const PIPELINE_STAGES = [
  { key: 'open', label: 'Open', href: '/tenders?status=open', color: 'bg-blue-500', textColor: 'text-blue-600', lightBg: 'bg-blue-500/10' },
  { key: 'evaluation', label: 'Under Evaluation', href: '/tenders?status=evaluation', color: 'bg-amber-500', textColor: 'text-amber-600', lightBg: 'bg-amber-500/10' },
  { key: 'closed', label: 'Closed', href: '/tenders?status=closed', color: 'bg-zinc-400', textColor: 'text-zinc-500', lightBg: 'bg-zinc-400/10' },
  { key: 'awarded', label: 'Awarded', href: '/tenders?status=awarded', color: 'bg-green-500', textColor: 'text-green-600', lightBg: 'bg-green-500/10' },
  { key: 'lost', label: 'Lost / Rejected', href: '/tenders?status=lost', color: 'bg-red-500', textColor: 'text-red-600', lightBg: 'bg-red-500/10' },
] as const;

export function PipelineFunnel({ statusCounts, className = '' }: PipelineFunnelProps) {
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pipeline Overview
          </CardTitle>
          <CardDescription>Tender flow through pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No tenders in the pipeline yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pipeline Overview
        </CardTitle>
        <CardDescription>
          {total} tenders across {Object.values(statusCounts).filter((c) => c > 0).length} stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage) => {
            const count = statusCounts[stage.key as keyof typeof statusCounts] ?? 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <Link key={stage.key} href={stage.href} className="block group">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 rounded-md overflow-hidden bg-muted/50">
                    {/* Funnel bar — uses clip-path for tapered funnel shape */}
                    <div
                      className={`absolute inset-y-0 left-0 ${stage.color} transition-all duration-500 ease-out`}
                      style={{
                        width: `${Math.max(barWidth, 3)}%`,
                        clipPath: 'polygon(0 0, 100% 4%, 100% 96%, 0 100%)',
                      }}
                    />
                    {/* Count label inside the bar */}
                    {barWidth > 15 && (
                      <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white z-10">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Win rate indicator */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pipeline → Project Conversion</span>
            <span className="font-semibold text-green-600">
              {total > 0 ? Math.round(((statusCounts.awarded || 0) / total) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1.5 w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${total > 0 ? ((statusCounts.awarded || 0) / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
