import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, MapPin, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { getUpcomingBriefings } from '@/server/tenders';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface DashboardBriefingsProps {
  organizationId: string;
}

export async function DashboardBriefings({
  organizationId,
}: DashboardBriefingsProps) {
  const { briefings } = await getUpcomingBriefings(organizationId, 10);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Card className="backdrop-blur-md bg-card/70 border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          Clarification Meetings & Briefings
        </CardTitle>
        <CardDescription>
          Upcoming briefing sessions and clarification meetings in the next 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!briefings || briefings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
            No upcoming briefings or clarification meetings scheduled
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-4">
              {briefings.map((briefing) => {
                const isOnline = briefing.briefingLocation?.toLowerCase().includes('http') || 
                                 briefing.briefingLocation?.toLowerCase().includes('teams') || 
                                 briefing.briefingLocation?.toLowerCase().includes('zoom');
                
                return (
                  <div
                    key={briefing.id}
                    className="flex flex-col gap-2 p-3 rounded-lg border bg-background/50 hover:bg-accent/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Link
                          href={`/tenders/${briefing.id}`}
                          className="font-semibold text-sm hover:underline text-primary"
                        >
                          {briefing.tenderNumber.toUpperCase()}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {briefing.client?.name || 'Unknown Client'}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {briefing.isBriefingMandatory && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 font-semibold uppercase animate-pulse">
                            Mandatory
                          </Badge>
                        )}
                        {briefing.briefingAttended ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] px-1.5 py-0 h-5 font-semibold flex items-center gap-0.5">
                            <CheckCircle className="h-2.5 w-2.5" />
                            Attended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-muted-foreground">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500/80" />
                        <span>{formatDate(briefing.briefingDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isOnline ? (
                          <>
                            <Video className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            {briefing.briefingLocation?.startsWith('http') ? (
                              <a
                                href={briefing.briefingLocation}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 hover:underline truncate"
                              >
                                Join Online Meeting
                              </a>
                            ) : (
                              <span className="truncate">{briefing.briefingLocation}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="truncate" title={briefing.briefingLocation || ''}>
                              {briefing.briefingLocation || 'No venue specified'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
