"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { getCalendarEvents } from "@/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CalendarDays,
} from "lucide-react";

type CalendarType =
  | "tender_submission"
  | "po_expected_delivery"
  | "po_delivered";

interface MiniCalendarWidgetProps {
  className?: string;
}

export function MiniCalendarWidget({ className }: MiniCalendarWidgetProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [activeView, setActiveView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [selectedTypes, setSelectedTypes] = useState<CalendarType[]>([
    "tender_submission",
    "po_expected_delivery",
    "po_delivered",
  ]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return today.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  });

  const handleDatesSet = useCallback(
    async (arg: DatesSetArg) => {
      setCurrentMonth(arg.view.title);
      const startIso = arg.startStr;
      const endIso = arg.endStr;
      startTransition(async () => {
        const calendarEvents = await getCalendarEvents({
          start: startIso,
          end: endIso,
          types: ["tender_submission", "po_expected_delivery", "po_delivered"],
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
    [startTransition],
  );

  const today = new Date();

  // Filter events based on active category checkboxes
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const type =
        (e.classNames?.[0]?.replace("event-", "") as CalendarType) ||
        "tender_submission";
      return selectedTypes.includes(type);
    });
  }, [events, selectedTypes]);

  // Handle clicking an event pill directly in the calendar grid
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      info.jsEvent.preventDefault();
      const type =
        (info.event.classNames?.[0]?.replace("event-", "") as CalendarType) ||
        "tender_submission";
      if (type === "tender_submission") {
        router.push(`/tenders/${info.event.id}`);
      } else {
        router.push(`/projects/purchase-orders/${info.event.id}`);
      }
    },
    [router],
  );

  // Handle clicking a day cell to filter events for that day
  const handleDateClick = useCallback((info: { dateStr: string }) => {
    const day = info.dateStr.split("T")[0];
    setSelectedDate((prev) => (prev === day ? null : day));
  }, []);

  // Events for the selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents
      .filter((e) => {
        const eDate = typeof e.start === "string" ? e.start.split("T")[0] : "";
        return eDate === selectedDate;
      })
      .map((e) => ({
        id: e.id as string,
        title: e.title as string,
        date: e.start as string,
        type:
          (e.classNames?.[0]?.replace("event-", "") as CalendarType) ||
          "tender_submission",
      }));
  }, [filteredEvents, selectedDate]);

  // Overall upcoming events (when no specific date is selected)
  const upcomingEvents = useMemo(() => {
    const upcoming: Array<{
      id: string;
      title: string;
      date: string;
      type: CalendarType;
    }> = [];

    filteredEvents.forEach((event) => {
      if (event.start) {
        const eventDate = new Date(event.start as string);
        if (eventDate >= today) {
          upcoming.push({
            id: event.id as string,
            title: event.title as string,
            date: event.start as string,
            type:
              (event.classNames?.[0]?.replace("event-", "") as CalendarType) ||
              "tender_submission",
          });
        }
      }
    });

    return upcoming
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [filteredEvents, today]);

  // Navigation handlers
  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const handleViewChange = (view: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => {
    setActiveView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  const toggleType = (type: CalendarType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.length > 1
          ? prev.filter((t) => t !== type)
          : prev
        : [...prev, type],
    );
  };

  const getEventBadge = (type: CalendarType) => {
    switch (type) {
      case "tender_submission":
        return (
          <Badge className="text-xs bg-primary text-primary-foreground font-semibold">
            Tender
          </Badge>
        );
      case "po_expected_delivery":
        return (
          <Badge className="text-xs bg-yellow-500/15 text-yellow-500 border-yellow-500/30 font-semibold">
            PO Expected
          </Badge>
        );
      case "po_delivered":
        return (
          <Badge className="text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-semibold">
            PO Delivered
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getEventEmoji = (type: CalendarType) => {
    switch (type) {
      case "tender_submission":
        return "📝";
      case "po_expected_delivery":
        return "🚚";
      case "po_delivered":
        return "✅";
      default:
        return "📅";
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

  const displayedList = selectedDate ? selectedDateEvents : upcomingEvents;

  return (
    <div className={cn("flex flex-col lg:flex-row gap-4 h-full", className)}>
      {/* Calendar Card */}
      <div className="w-full lg:w-3/5 min-w-[280px] h-full flex flex-col">
        <Card className="h-full border-white/10 bg-card/45 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
          {/* Interactive Header Toolbar */}
          <CardHeader className="pb-2.5 pt-3.5 px-4 shrink-0 space-y-2.5 border-b border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Month title and pagination */}
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight text-foreground">
                  {currentMonth}
                </CardTitle>
                <div className="flex items-center gap-0.5 bg-background/50 rounded-lg p-0.5 border border-white/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handlePrev}
                    title="Previous"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={handleToday}
                    title="Jump to Today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={handleNext}
                    title="Next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* View Switcher: Month / Week / Day */}
              <div className="flex items-center bg-background/60 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => handleViewChange("dayGridMonth")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors",
                    activeView === "dayGridMonth"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("timeGridWeek")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors",
                    activeView === "timeGridWeek"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("timeGridDay")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-colors",
                    activeView === "timeGridDay"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Day
                </button>
              </div>
            </div>

            {/* Event Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filters:
              </span>

              <button
                type="button"
                onClick={() => toggleType("tender_submission")}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer",
                  selectedTypes.includes("tender_submission")
                    ? "bg-primary/20 text-primary border-primary/40 shadow-xs"
                    : "bg-muted/20 text-muted-foreground/60 border-transparent hover:border-white/10 line-through",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Tenders
              </button>

              <button
                type="button"
                onClick={() => toggleType("po_expected_delivery")}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer",
                  selectedTypes.includes("po_expected_delivery")
                    ? "bg-yellow-500/15 text-yellow-500 border-yellow-500/35 shadow-xs"
                    : "bg-muted/20 text-muted-foreground/60 border-transparent hover:border-white/10 line-through",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                PO Expected
              </button>

              <button
                type="button"
                onClick={() => toggleType("po_delivered")}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer",
                  selectedTypes.includes("po_delivered")
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/35 shadow-xs"
                    : "bg-muted/20 text-muted-foreground/60 border-transparent hover:border-white/10 line-through",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                PO Delivered
              </button>
            </div>
          </CardHeader>

          {/* Calendar Content Area */}
          <CardContent className="p-3 flex-1 min-h-0 bg-background/20 overflow-hidden flex flex-col justify-between">
            {isPending && (
              <div className="h-0.5 w-full bg-primary animate-pulse rounded-full mb-2 shrink-0" />
            )}
            <div className="mini-calendar text-xs flex-1 flex flex-col">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                dayHeaderFormat={{ weekday: "short" }}
                events={filteredEvents}
                datesSet={handleDatesSet}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="100%"
                dayMaxEvents={2}
                dayCellClassNames={(arg) => {
                  const dayStr = arg.date.toISOString().split("T")[0];
                  const localDayStr = `${arg.date.getFullYear()}-${String(arg.date.getMonth() + 1).padStart(2, "0")}-${String(arg.date.getDate()).padStart(2, "0")}`;
                  if (selectedDate && (dayStr === selectedDate || localDayStr === selectedDate)) {
                    return ["fc-day-selected"];
                  }
                  return [];
                }}
              />
              <style jsx global>{`
                .mini-calendar .fc {
                  --fc-border-color: rgba(255, 255, 255, 0.06);
                  --fc-page-bg-color: transparent;
                  height: 100% !important;
                }
                .mini-calendar .fc-scroller {
                  overflow: hidden !important;
                }
                .mini-calendar .fc-scroller-liquid-absolute {
                  overflow: hidden !important;
                }
                .mini-calendar .fc-theme-standard th {
                  border: none;
                  padding: 0.35rem 0.25rem;
                }
                .mini-calendar .fc-col-header-cell-cushion {
                  font-size: 0.65rem;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  color: hsl(var(--muted-foreground));
                }
                .mini-calendar .fc-scrollgrid {
                  border: none !important;
                }
                .mini-calendar .fc-daygrid-day {
                  padding: 2px;
                  min-height: 24px;
                  cursor: pointer;
                  transition: background-color 0.15s ease;
                }
                .mini-calendar .fc-daygrid-day:hover {
                  background-color: rgba(255, 255, 255, 0.04);
                }
                .mini-calendar .fc-daygrid-day.fc-day-selected {
                  background-color: hsl(var(--primary) / 0.14) !important;
                  box-shadow: inset 0 0 0 1.5px hsl(var(--primary) / 0.6);
                  border-radius: 4px;
                }
                .mini-calendar .fc-daygrid-day-frame {
                  min-height: auto !important;
                  padding: 0;
                }
                .mini-calendar .fc-daygrid-day-number {
                  font-size: 0.7rem;
                  padding: 2px;
                  color: hsl(var(--foreground) / 0.85);
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
                  font-weight: 700;
                }
                .mini-calendar .fc-event {
                  font-size: 0.62rem;
                  padding: 1.5px 3px;
                  border-radius: 3px;
                  margin-bottom: 2px;
                  border: none;
                  cursor: pointer !important;
                  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
                }
                .mini-calendar .fc-event:hover {
                  transform: translateY(-1px);
                  opacity: 0.92;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
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

      {/* Events Panel (Filtered by Day or Upcoming) */}
      <div className="w-full lg:w-2/5 min-w-[280px] h-full flex flex-col">
        <Card className="h-full border-white/10 bg-card/45 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
          <CardHeader className="pb-2.5 pt-3.5 px-4 shrink-0 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground/95">
                  {selectedDate ? `Events for ${formatDate(selectedDate)}` : "Upcoming Events"}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                  {displayedList.length}
                </Badge>
              </div>

              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                  onClick={() => setSelectedDate(null)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Show Upcoming
                </Button>
              )}
            </div>
            {!selectedDate && (
              <p className="text-[11px] text-muted-foreground">
                Click any day or event pill on the calendar to filter details
              </p>
            )}
          </CardHeader>

          <CardContent className="p-3 flex-1 min-h-0 bg-background/20 overflow-auto scrollbar-thin">
            {displayedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <span className="text-2xl mb-1 opacity-50">📅</span>
                <p className="text-xs text-muted-foreground">
                  {selectedDate
                    ? `No events scheduled on ${formatDate(selectedDate)}`
                    : "No upcoming events scheduled"}
                </p>
                {selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-xs"
                    onClick={() => setSelectedDate(null)}
                  >
                    View All Upcoming
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedList.map((event) => {
                  const daysUntil = getDaysUntil(event.date);
                  return (
                    <Link
                      key={event.id}
                      href={
                        event.type === "tender_submission"
                          ? `/tenders/${event.id}`
                          : `/projects/purchase-orders/${event.id}`
                      }
                      className="block group"
                    >
                      <div className="group flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-background/30 hover:bg-muted/30 hover:border-white/10 hover:-translate-y-0.5 transform transition-all duration-300 ease-out">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors">
                            <span className="text-sm shrink-0">
                              {getEventEmoji(event.type)}
                            </span>
                            <span className="truncate">{event.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground ml-6 mt-0.5">
                            {formatDate(event.date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 ml-2 shrink-0">
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
