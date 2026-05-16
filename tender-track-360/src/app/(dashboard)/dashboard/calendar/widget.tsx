'use client';

import React, { useCallback, useMemo, useState, useTransition } from 'react';
import FullCalendar from '@fullcalendar/react';
import type {
  DatesSetArg,
  EventClickArg,
  EventInput,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getCalendarEvents } from '@/server';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

type CalendarType =
  | 'tender_submission'
  | 'po_expected_delivery'
  | 'po_delivered';

export function CalendarClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [types, setTypes] = useState<CalendarType[]>([
    'tender_submission',
    'po_expected_delivery',
    'po_delivered',
  ]);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const handleRangeChange = useCallback(
    async (arg: DatesSetArg, setEvents: (events: EventInput[]) => void) => {
      const startIso = arg.startStr;
      const endIso = arg.endStr;
      startTransition(async () => {
        const events = await getCalendarEvents({
          start: startIso,
          end: endIso,
          types,
          status: status ? [status] : undefined,
        });
        const fullcalendarEvents = events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.date,
          allDay: true,
          classNames: [`event-${e.type}`, `color-${e.color}`],
        }));
        setEvents(fullcalendarEvents);
      });
    },
    [types, status]
  );

  const headerToolbar = useMemo(
    () => ({
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    }),
    []
  );

  const [fcEvents, setFcEvents] = useState<EventInput[]>([]);

  const onDatesSet = useCallback(
    (arg: DatesSetArg) => handleRangeChange(arg, setFcEvents),
    [handleRangeChange]
  );

  const onEventClick = useCallback(
    (info: EventClickArg) => {
      // Basic routing heuristic: tenders vs POs by CSS class
      if (info.event.classNames.includes('event-tender_submission')) {
        router.push(`/dashboard/tenders`);
      } else {
        router.push(`/dashboard/projects`);
      }
    },
    [router]
  );

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {isPending && (
        <div className="h-0.5 w-full bg-green-400 animate-pulse shrink-0 rounded-full" />
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-muted/20 rounded-lg border border-white/5 shrink-0">
        {/* Filter Checkboxes (Left) */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="chk-tender"
              checked={types.includes('tender_submission')}
              onCheckedChange={(c) => {
                const checked = Boolean(c);
                setTypes((prev) =>
                  checked
                    ? Array.from(new Set([...prev, 'tender_submission']))
                    : prev.filter((t) => t !== 'tender_submission')
                );
              }}
              className="h-2 w-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="chk-tender"
              className="text-xs font-medium leading-none cursor-pointer"
            >
              Tenders
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="chk-po-exp"
              checked={types.includes('po_expected_delivery')}
              onCheckedChange={(c) => {
                const checked = Boolean(c);
                setTypes((prev) =>
                  checked
                    ? Array.from(new Set([...prev, 'po_expected_delivery']))
                    : prev.filter((t) => t !== 'po_expected_delivery')
                );
              }}
              className="h-2 w-2 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
            />
            <label
              htmlFor="chk-po-exp"
              className="text-xs font-medium leading-none cursor-pointer"
            >
              PO Expected
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="chk-po-del"
              checked={types.includes('po_delivered')}
              onCheckedChange={(c) => {
                const checked = Boolean(c);
                setTypes((prev) =>
                  checked
                    ? Array.from(new Set([...prev, 'po_delivered']))
                    : prev.filter((t) => t !== 'po_delivered')
                );
              }}
              className="h-2 w-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <label
              htmlFor="chk-po-del"
              className="text-xs font-medium leading-none cursor-pointer"
            >
              PO Delivered
            </label>
          </div>
        </div>

        {/* Legend (Right) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline-block">
            Legend:
          </span>
          <Badge className="text-xs px-2 py-0.5 bg-primary text-primary-foreground hover:bg-primary/90">
            Tender submission
          </Badge>
          <Badge className="text-xs px-2 py-0.5 bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/25">
            PO expected
          </Badge>
          <Badge className="text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/25">
            PO delivered
          </Badge>
          <Badge
            variant="outline"
            className="text-xs px-2 py-0.5 border-destructive/30 text-destructive bg-destructive/5"
          >
            Overdue
          </Badge>
        </div>
      </div>

      <div className="calendar-compact text-sm flex-1 min-h-0 relative">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={headerToolbar}
          dayHeaderFormat={{ weekday: 'short' }}
          events={fcEvents}
          datesSet={onDatesSet}
          eventClick={onEventClick}
          height="100%"
          expandRows={true}
          stickyHeaderDates
          dayMaxEventRows={3}
        />
        <style jsx global>{`
          .calendar-compact .fc {
            height: 100%;
            --fc-border-color: rgba(255, 255, 255, 0.05);
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: rgba(255, 255, 255, 0.02);
            --fc-today-bg-color: rgba(
              var(--primary-rgb),
              0.05
            ); /* Needs rgb var or hardcoded */
            --fc-today-bg-color: oklch(0.705 0.213 47.604 / 0.1);
          }

          /* Header & Toolbar */
          .calendar-compact .fc-header-toolbar {
            margin-bottom: 1rem !important;
            padding: 0 0.5rem;
          }
          .calendar-compact .fc-toolbar-title {
            font-size: 1.5rem !important;
            font-weight: 600;
            letter-spacing: -0.02em;
          }
          .calendar-compact .fc-button {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: hsl(var(--foreground));
            font-size: 0.75rem !important;
            font-weight: 500;
            padding: 0.35rem 0.8rem !important;
            text-transform: capitalize;
            border-radius: 0.5rem;
            transition: all 0.2s;
            box-shadow: none !important;
          }
          .calendar-compact .fc-button:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
          }
          .calendar-compact .fc-button-active {
            background: hsl(var(--primary)) !important;
            border-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }

          /* Grid & Cells */
          .calendar-compact .fc-theme-standard th {
            border: none;
            padding-bottom: 0.5rem;
          }
          .calendar-compact .fc-col-header-cell-cushion {
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: hsl(var(--muted-foreground));
            padding-top: 4px;
            padding-bottom: 4px;
          }

          /* Remove outer borders for cleaner look */
          .calendar-compact .fc-scrollgrid {
            border: none !important;
          }
          .calendar-compact .fc-scrollgrid-section > td {
            border: none !important;
          }

          .calendar-compact .fc-daygrid-day {
            border: 1px solid rgba(255, 255, 255, 0.03);
          }
          .calendar-compact .fc-daygrid-day-frame {
            min-height: 0 !important;
            padding: 4px;
          }

          /* Events */
          .calendar-compact .fc-event {
            border: none;
            border-radius: 4px;
            padding: 2px 4px;
            margin-bottom: 2px;
            font-size: 0.7rem;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.1s;
          }
          .calendar-compact .fc-event:hover {
            transform: scale(1.01);
            filter: brightness(1.1);
          }

          /* Specific Event Colors based on our naming */
          .event-tender_submission {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
          }
          .event-po_expected_delivery {
            background-color: #eab308; /* Yellow-500 */
            color: #422006; /* Yellow-950 */
          }
          .event-po_delivered {
            background-color: #10b981; /* Emerald-500 */
            color: #022c22; /* Emerald-950 */
          }

          /* Today Highlight */
          .calendar-compact .fc-day-today {
            background-color: transparent !important;
          }
          .calendar-compact .fc-day-today .fc-daygrid-day-number {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px;
          }
        `}</style>
      </div>
    </div>
  );
}
