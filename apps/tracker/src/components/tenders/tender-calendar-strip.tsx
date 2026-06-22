'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarDays, AlertTriangle, Clock, PhoneCall, FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/format';
import Link from 'next/link';
import type { CalendarEvent } from '@/server/tender-workload';

interface TenderCalendarStripProps {
  events: CalendarEvent[];
}

const eventMeta: Record<CalendarEvent['type'], {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  closing_date: { icon: Clock, label: 'Closing' },
  briefing: { icon: CalendarDays, label: 'Briefing' },
  validity_expiry: { icon: AlertTriangle, label: 'Validity' },
  follow_up: { icon: PhoneCall, label: 'Follow-up' },
  tender_extension: { icon: FileText, label: 'Extension' },
};

function getUrgencyColor(urgency: CalendarEvent['urgency']) {
  switch (urgency) {
    case 'critical': return 'border-l-red-500 bg-red-500/5';
    case 'warning': return 'border-l-amber-500 bg-amber-500/5';
    case 'info': return 'border-l-blue-500 bg-blue-500/5';
  }
}

function getUrgencyDot(urgency: CalendarEvent['urgency']) {
  switch (urgency) {
    case 'critical': return 'bg-red-500';
    case 'warning': return 'bg-amber-500';
    case 'info': return 'bg-blue-500';
  }
}

export function TenderCalendarStrip({ events }: TenderCalendarStripProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No upcoming events in the next 30 days.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only the next 6 events
  const displayEvents = events.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Upcoming Events
          <span className="text-xs font-normal text-muted-foreground ml-1">
            ({events.length} in 30 days)
          </span>
        </CardTitle>
        <Link
          href="/tenders?status=all"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayEvents.map((event) => {
            const meta = eventMeta[event.type];
            const Icon = meta.icon;
            const daysUntil = Math.ceil((event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <Link
                key={event.id}
                href={`/tenders/${event.tenderId}`}
                className={`flex items-start gap-3 p-2.5 rounded-lg border-l-2 transition-all hover:shadow-sm ${getUrgencyColor(event.urgency)}`}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getUrgencyDot(event.urgency)}`} />
                    <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(event.date)}
                    </span>
                    {daysUntil >= 0 && (
                      <span className={`text-[10px] font-medium ${
                        daysUntil <= 1 ? 'text-red-500' :
                        daysUntil <= 3 ? 'text-orange-500' :
                        daysUntil <= 7 ? 'text-amber-500' :
                        'text-muted-foreground'
                      }`}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {meta.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {events.length > 6 && (
          <div className="mt-3 text-center">
            <Link
              href="/tenders?status=all"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              +{events.length - 6} more event{events.length - 6 !== 1 ? 's' : ''}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
