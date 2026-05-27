'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

interface UpcomingDeadline {
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

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  className?: string;
}

function getUrgencyColor(daysUntil: number | null): string {
  if (daysUntil === null)
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  if (daysUntil <= 1)
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  if (daysUntil <= 3)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  if (daysUntil <= 7)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
}

function getUrgencyIcon(daysUntil: number | null) {
  if (daysUntil === null) return <Calendar className="h-3 w-3" />;
  if (daysUntil <= 1) return <AlertTriangle className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

function formatDaysUntil(daysUntil: number | null): string {
  if (daysUntil === null) return 'No deadline';
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return '1 day left';
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  return `${daysUntil} days left`;
}

export function UpcomingDeadlines({
  deadlines,
  className = '',
}: UpcomingDeadlinesProps) {
  const urgentDeadlines = deadlines.filter(
    (d) => d.daysUntilDeadline !== null && d.daysUntilDeadline <= 3
  );
  const hasUrgent = urgentDeadlines.length > 0;

  if (deadlines.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No upcoming deadlines
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Deadlines
          {hasUrgent && (
            <Badge variant="destructive" className="text-xs">
              {urgentDeadlines.length} urgent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {deadline.tenderNumber}
                  </span>
                  <Badge
                    className={getUrgencyColor(deadline.daysUntilDeadline)}
                  >
                    {getUrgencyIcon(deadline.daysUntilDeadline)}
                    <span className="ml-1">
                      {formatDaysUntil(deadline.daysUntilDeadline)}
                    </span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {deadline.description || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {deadline.client?.name || 'Unknown Client'}
                  </p>
                  {deadline.value && (
                    <p className="text-xs font-medium">
                      ${parseFloat(deadline.value).toLocaleString()}
                    </p>
                  )}
                </div>
                {deadline.submissionDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {deadline.submissionDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
