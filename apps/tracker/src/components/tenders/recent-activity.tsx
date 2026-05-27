'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, TrendingUp } from 'lucide-react';

interface RecentTender {
  id: string;
  tenderNumber: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    name: string;
  } | null;
}

interface RecentActivityProps {
  recentTenders: RecentTender[];
  recentChanges: RecentTender[];
  className?: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'won':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'lost':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}

type ActivityItem = RecentTender & { type: 'new' | 'change' };

export function RecentActivity({
  recentTenders,
  recentChanges,
  className = '',
}: RecentActivityProps) {
  const combined: ActivityItem[] = [
    ...recentTenders.map((t) => ({ ...t, type: 'new' as const })),
    ...recentChanges.map((t) => ({ ...t, type: 'change' as const })),
  ]
    .sort((a, b) => {
      const dateA = a.type === 'new' ? a.createdAt : a.updatedAt;
      const dateB = b.type === 'new' ? b.createdAt : b.updatedAt;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  if (combined.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No recent activity to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {combined.map((item) => {
            const icon =
              item.type === 'new' ? (
                <FileText className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              );
            const time = item.type === 'new' ? item.createdAt : item.updatedAt;
            return (
              <div
                key={`${item.id}-${item.type}`}
                className="flex items-start justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <span className="font-medium text-sm truncate">
                      {item.tenderNumber}
                    </span>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.client?.name || 'Unknown Client'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatTimeAgo(time)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
