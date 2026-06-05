'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { DatesSetArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getCalendarEvents } from '@/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type CalendarType =
  | 'tender_submission'
  | 'po_expected_delivery'
  | 'po_delivered';

interface MiniCalendarWidgetProps {
  className?: string;
}

export function MiniCalendarWidget({ className }: MiniCalendarWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<EventInput[]>([]);

  const headerToolbar = useMemo(
    () => ({
      left: 'prev',
      center: 'title',
      right: 'next',
    }),
    []
  );

  const handleDatesSet = useCallback(
    async (arg: DatesSetArg) => {
      const startIso = arg.startStr;
      const endIso = arg.endStr;
      startTransition(async () => {
        const calendarEvents = await getCalendarEvents({
          start: startIso,
          end: endIso,
          types: ['tender_submission', 'po_expected_delivery', 'po_delivered'],
        });
        const fullcalendarEvents = calendarEvents.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.date,
          allDay: true,
          classNames: [`event-${e.type}`, `color-${e.color}`],
        }));
        setEvents(fullcalendarEvents);
      });
    },
    [startTransition]
  );

  const today = new Date();
  const currentMonth = today.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const upcomingEvents = useMemo(() => {
    const upcoming: Array<{
      id: string;
      title: string;
      date: string;
      type: CalendarType;
    }> = [];

    events.forEach((event) => {
      if (event.start) {
        const eventDate = new Date(event.start as string);
        if (eventDate >= today) {
          upcoming.push({
            id: event.id as string,
            title: event.title as string,
            date: event.start as string,
            type:
              (event.classNames?.[0]?.replace('event-', '') as CalendarType) ||
              'tender_submission',
          });
        }
      }
    });

    return upcoming
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events, today]);

  const getEventBadge = (type: CalendarType) => {
    switch (type) {
      case 'tender_submission':
        return (
          <Badge className="text-xs bg-primary text-primary-foreground">
            Tender
          </Badge>
        );
      case 'po_expected_delivery':
        return (
          <Badge className="text-xs bg-yellow-500/15 text-yellow-600 border-yellow-500/20">
            PO Expected
          </Badge>
        );
      case 'po_delivered':
        return (
          <Badge className="text-xs bg-emerald-500/15 text-emerald-600 border-emerald-500/20">
            PO Delivered
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className={cn('flex gap-4', className)}>
      {/* Mini Calendar */}
      <div className="w-1/2 min-w-[200px]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {isPending && (
              <div className="h-0.5 w-full bg-green-400 animate-pulse rounded-full mb-2" />
            )}
            <div className="mini-calendar text-xs">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={headerToolbar}
                dayHeaderFormat={{ weekday: 'short' }}
                events={events}
                datesSet={handleDatesSet}
                height="auto"
                dayMaxEvents={2}
              />
              <style jsx global>{`
                .mini-calendar .fc {
                  --fc-border-color: rgba(255, 255, 255, 0.05);
                  --fc-page-bg-color: transparent;
                }
                .mini-calendar .fc-header-toolbar {
                  margin-bottom: 0.5rem !important;
                  padding: 0;
                }
                .mini-calendar .fc-toolbar-title {
                  font-size: 0.875rem !important;
                  font-weight: 600;
                }
                .mini-calendar .fc-button {
                  background: transparent;
                  border: none;
                  color: hsl(var(--muted-foreground));
                  font-size: 0.75rem;
                  padding: 0.25rem 0.5rem;
                  box-shadow: none !important;
                }
                .mini-calendar .fc-button:hover {
                  background: rgba(255, 255, 255, 0.05);
                }
                .mini-calendar .fc-theme-standard th {
                  border: none;
                  padding: 0.25rem;
                }
                .mini-calendar .fc-col-header-cell-cushion {
                  font-size: 0.65rem;
                  text-transform: uppercase;
                  color: hsl(var(--muted-foreground));
                }
                .mini-calendar .fc-scrollgrid {
                  border: none !important;
                }
                .mini-calendar .fc-daygrid-day {
                  padding: 2px;
                  min-height: 24px;
                }
                .mini-calendar .fc-daygrid-day-frame {
                  min-height: auto !important;
                  padding: 0;
                }
                .mini-calendar .fc-daygrid-day-number {
                  font-size: 0.7rem;
                  padding: 2px;
                }
                .mini-calendar .fc-event {
                  font-size: 0.6rem;
                  padding: 1px 2px;
                  border-radius: 2px;
                  margin-bottom: 1px;
                }
                .mini-calendar .fc-day-today .fc-daygrid-day-number {
                  background-color: hsl(var(--primary));
                  color: hsl(var(--primary-foreground));
                  border-radius: 50%;
                  width: 18px;
                  height: 18px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .event-tender_submission {
                  background-color: hsl(var(--primary));
                  color: hsl(var(--primary-foreground));
                }
                .event-po_expected_delivery {
                  background-color: #eab308;
                  color: #422006;
                }
                .event-po_delivered {
                  background-color: #10b981;
                  color: #022c22;
                }
              `}</style>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events List */}
      <div className="w-1/2 min-w-[200px]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  const daysUntil = getDaysUntil(event.date);
                  return (
                    <Link
                      key={event.id}
                      href={
                        event.type === 'tender_submission'
                          ? '/tenders'
                          : '/projects'
                      }
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          {getEventBadge(event.type)}
                          <span className="text-xs text-muted-foreground">
                            {daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                                ? 'Tomorrow'
                                : `${daysUntil} days`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
