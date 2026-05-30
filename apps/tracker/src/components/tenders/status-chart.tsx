'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface StatusChartProps {
  statusCounts: {
    open: number;
    closed: number;
    evaluation: number;
    awarded: number;
    lost: number;
  };
  className?: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-green-500';
    case 'closed':
      return 'bg-gray-500';
    case 'evaluation':
      return 'bg-blue-500';
    case 'awarded':
      return 'bg-amber-500';
    case 'lost':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'closed':
      return 'Closed';
    case 'evaluation':
      return 'Evaluation';
    case 'awarded':
      return 'Appointed / Awarded';
    case 'lost':
      return 'Rejected / Lost';
    default:
      return status;
  }
}

export function StatusChart({
  statusCounts,
  className = '',
}: StatusChartProps) {
  const total = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (total === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No tender data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusEntries = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / total) * 100),
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusEntries.map(({ status, count, percentage }) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}
                  />
                  <span className="text-sm font-medium truncate">
                    {getStatusLabel(status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({percentage}%)
                  </span>
                </div>
              </div>
              <div className="ml-4 w-24">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(status)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
