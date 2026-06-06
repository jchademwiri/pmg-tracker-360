'use client';

import dynamic from 'next/dynamic';

const DynamicMiniCalendar = dynamic(
  () => import('./mini-calendar-widget').then(mod => mod.MiniCalendarWidget),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full animate-pulse bg-muted/40 border border-dashed rounded-xl flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading calendar view...</span>
      </div>
    ),
  }
);

interface ClientCalendarProps {
  className?: string;
}

export function ClientCalendar({ className }: ClientCalendarProps) {
  return <DynamicMiniCalendar className={className} />;
}
