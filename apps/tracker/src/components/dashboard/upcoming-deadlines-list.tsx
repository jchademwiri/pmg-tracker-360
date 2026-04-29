'use client';

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@pmg/ui/components/ui/badge';
import { Button } from '@pmg/ui/components/ui/button';
import { ScrollArea } from '@pmg/ui/components/ui/scroll-area';

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
                    href={`/dashboard/tenders/${item.id}`}
                    className="font-medium hover:underline truncate"
                  >
                    {item.tenderNumber}
                  </Link>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 h-5"
                  >
                    {item.daysUntilDeadline} days
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {item.client?.name || 'Unknown Client'}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {item.submissionDate
                    ? new Date(item.submissionDate).toLocaleDateString()
                    : 'No date'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                asChild
                aria-label="View tender details"
              >
                <Link href={`/dashboard/tenders/${item.id}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="pt-2 border-t">
        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
          <Link href="/dashboard/tenders?sort=deadline">
            View All Deadlines
          </Link>
        </Button>
      </div>
    </div>
  );
}
