'use client';

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getDeadlineUrgencyClass,
  getDeadlineUrgencyLabel,
} from '@/lib/deadline-display';

interface UpcomingDeadlineItem {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  status: string;
  value: string | null;
  client: { name: string | null } | null;
  daysUntilDeadline: number | null;
}

interface UpcomingDeadlinesListProps {
  deadlines: UpcomingDeadlineItem[];
}

export function UpcomingDeadlinesList({
  deadlines,
}: UpcomingDeadlinesListProps) {
  const formatDeadline = (date: Date | null) => {
    if (!date) return 'No date';

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-3 bg-muted rounded-full mb-3">
          <Calendar className="h-6 w-6 text-muted-foreground opacity-50" />
        </div>
        <p className="text-sm font-medium text-foreground">
          No upcoming deadlines
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          You have no tenders due in the next 30 days
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {deadlines.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tenders/${item.id}`}
                    className="font-medium hover:underline truncate"
                  >
                    {item.tenderNumber}
                  </Link>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-5 ${getDeadlineUrgencyClass(
                      item.daysUntilDeadline
                    )}`}
                  >
                    {getDeadlineUrgencyLabel(item.daysUntilDeadline)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {item.client?.name || 'Unknown Client'}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDeadline(item.submissionDate)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                asChild
                aria-label="View tender details"
              >
                <Link href={`/tenders/${item.id}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="pt-2 border-t">
        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
          <Link href="/tenders/overview?sortBy=submissionDate&sortOrder=asc">
            View All Deadlines
          </Link>
        </Button>
      </div>
    </div>
  );
}
