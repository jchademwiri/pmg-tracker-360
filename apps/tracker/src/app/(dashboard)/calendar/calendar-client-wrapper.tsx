'use client';

import dynamic from 'next/dynamic';

const DynamicCalendar = dynamic(
  () => import('./widget').then((mod) => mod.CalendarClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full min-h-[500px] animate-pulse bg-muted/40 border border-dashed rounded-xl flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading calendar view...</span>
      </div>
    ),
  }
);

export function CalendarClientWrapper() {
  return <DynamicCalendar />;
}
