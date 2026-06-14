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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return today.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  });

  const headerToolbar = useMemo(
    () => ({
      left: 'prev',
      center: '',
      right: 'next',
    }),
    []
  );

  const handleDatesSet = useCallback(
    async (arg: DatesSetArg) => {
      setCurrentMonth(arg.view.title);
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

  const getEventEmoji = (type: CalendarType) => {
    switch (type) {
      case 'tender_submission': return '📝';
      case 'po_expected_delivery': return '🚚';
      case 'po_delivered': return '✅';
      default: return '📅';
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days === 0) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
          Today
        </span>
      );
    }
    if (days === 1) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Tomorrow
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/30">
        in {days} days
      </span>
    );
  };

  return (
    <div className={cn('flex flex-col md:flex-row gap-4 h-full', className)}>
      {/* Mini Calendar */}
      <div className="w-full md:w-1/2 min-w-[200px] h-full">
        <Card className="h-full border-white/10 bg-card/45 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/95">
              {currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 min-h-0 bg-background/20 overflow-auto">
            {isPending && (
              <div className="h-0.5 w-full bg-primary animate-pulse rounded-full mb-2" />
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
                  color: hsl(var(--foreground));
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
                  color: hsl(var(--foreground)/0.8);
                }
                .mini-calendar .fc-event {
                  font-size: 0.6rem;
                  padding: 1px 2px;
                  border-radius: 2px;
                  margin-bottom: 1px;
                  border: none;
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
      <div className="w-full md:w-1/2 min-w-[200px] h-full">
        <Card className="h-full border-white/10 bg-card/45 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground/95">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 min-h-0 bg-background/20 overflow-auto scrollbar-thin">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <span className="text-2xl mb-1 opacity-50">📅</span>
                <p className="text-xs text-muted-foreground">
                  No upcoming events scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map((event) => {
                  const daysUntil = getDaysUntil(event.date);
                  return (
                    <Link
                      key={event.id}
                      href={
                        event.type === 'tender_submission'
                          ? `/tenders/${event.id}`
                          : `/projects/purchase-orders/${event.id}`
                      }
                      className="block group"
                    >
                      <div className="group flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-background/30 hover:bg-muted/30 hover:border-white/10 hover:-translate-y-0.5 transform transition-all duration-300 ease-out">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors">
                            <span className="text-sm shrink-0">{getEventEmoji(event.type)}</span>
                            <span className="truncate">{event.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground ml-6 mt-0.5">
                            {formatDate(event.date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 ml-2">
                          {getEventBadge(event.type)}
                          {getUrgencyBadge(daysUntil)}
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
