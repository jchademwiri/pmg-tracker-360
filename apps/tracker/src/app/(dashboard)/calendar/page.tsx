import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { ClientCalendar } from '@/components/dashboard/client-calendar';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full p-4 gap-4">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 h-64 w-64 -translate-y-1/2 -translate-x-1/2 rounded-full bg-secondary/30 blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-0 h-64 w-64 translate-y-1/2 translate-x-1/2 rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          </div>
          <p className="text-muted-foreground ml-10 text-lg">
            Track important deadlines and milestones.
          </p>
        </div>
      </div>

      <Card className="flex flex-col flex-1 border-white/10 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden min-h-0">
        <CardContent className="p-4 flex-1 min-h-0 bg-background/40">
          <ClientCalendar className="h-full" />
        </CardContent>
      </Card>
    </div>
  );
}
