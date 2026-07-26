'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  AlertTriangle, 
  Flame, 
  Calendar, 
  ClipboardCheck, 
  Trophy, 
  Eye, 
  Check, 
  Loader2,
  Building2,
  MoreHorizontalIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import Link from 'next/link';
import { toast } from 'sonner';
import { updateTender, updateTenderStatus } from '@/server/tenders';
import { useRouter } from 'next/navigation';
import { TenderToProjectDialog } from './tender-to-project-dialog';

interface ActionQueueTender {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate?: Date | null;
  briefingDate?: Date | null;
  briefingLocation?: string | null;
  status: string;
  value: string | null;
  awardValue?: string | null;
  client: {
    id: string;
    name: string;
  } | null;
}

interface ActionQueueData {
  overdue: ActionQueueTender[];
  closingSoon: ActionQueueTender[];
  briefingPending: ActionQueueTender[];
  awaitingResults: ActionQueueTender[];
  awardedToConvert: ActionQueueTender[];
}

interface TenderActionQueueProps {
  organizationId: string;
  initialQueues: ActionQueueData;
}

type QueueType = keyof ActionQueueData;

export function TenderActionQueue({ organizationId, initialQueues }: TenderActionQueueProps) {
  const router = useRouter();
  const [queues, setQueues] = useState<ActionQueueData>(initialQueues);
  const [selectedQueue, setSelectedQueue] = useState<QueueType>(() => {
    if (initialQueues.overdue.length > 0) return 'overdue';
    if (initialQueues.closingSoon.length > 0) return 'closingSoon';
    if (initialQueues.briefingPending.length > 0) return 'briefingPending';
    if (initialQueues.awaitingResults.length > 0) return 'awaitingResults';
    if (initialQueues.awardedToConvert.length > 0) return 'awardedToConvert';
    return 'overdue';
  });

  const [isPending, startTransition] = useTransition();
  
  // States for TenderToProjectDialog
  const [activeTender, setActiveTender] = useState<ActionQueueTender | null>(null);
  const [showAwardDialog, setShowAwardDialog] = useState(false);

  const handleMarkBriefingAttended = async (tenderId: string) => {
    startTransition(async () => {
      try {
        const result = await updateTender(organizationId, tenderId, {
          briefingAttended: true,
        });

        if (result.success) {
          toast.success('Briefing attendance recorded successfully');
          
          // Optimistically update client state
          setQueues(prev => ({
            ...prev,
            briefingPending: prev.briefingPending.filter(t => t.id !== tenderId)
          }));
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to record attendance');
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred');
      }
    });
  };

  const handleConvertToProjectClick = (tender: ActionQueueTender) => {
    setActiveTender(tender);
    setShowAwardDialog(true);
  };

  const handleConvertToProjectSubmit = async (data: any) => {
    if (!activeTender) return;

    startTransition(async () => {
      try {
        const result = await updateTenderStatus(organizationId, activeTender.id, {
          status: 'awarded',
          awardValue: data.awardValue ?? activeTender.value,
          contractStartDate: data.contractStartDate,
          contractEndDate: data.contractEndDate,
          signedContractUrl: data.signedContractUrl,
        });

        if (result.success) {
          toast.success('Tender converted to project successfully');
          setShowAwardDialog(false);
          setActiveTender(null);
          
          // Remove from local list
          setQueues(prev => ({
            ...prev,
            awardedToConvert: prev.awardedToConvert.filter(t => t.id !== activeTender.id)
          }));

          if (result.projectId) {
            router.push(`/projects/${result.projectId}/edit`);
          } else {
            router.refresh();
          }
        } else {
          toast.error(result.error || 'Failed to convert to project');
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred');
      }
    });
  };

  const queueConfig: Record<QueueType, {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    badgeVariant: 'destructive' | 'secondary' | 'outline' | 'default';
  }> = {
    overdue: {
      label: 'Overdue Tenders',
      description: 'Pre-submission tenders with closing dates in the past.',
      icon: AlertTriangle,
      colorClass: 'text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30',
      badgeVariant: 'destructive',
    },
    closingSoon: {
      label: 'Closing Soon',
      description: 'Pre-submission tenders closing in the next 14 days.',
      icon: Flame,
      colorClass: 'text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30',
      badgeVariant: 'default',
    },
    briefingPending: {
      label: 'Briefing Pending',
      description: 'Pre-submission tenders with mandatory briefings not yet recorded as attended.',
      icon: Calendar,
      colorClass: 'text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30',
      badgeVariant: 'secondary',
    },
    awaitingResults: {
      label: 'Awaiting Results',
      description: 'Tenders submitted or under evaluation.',
      icon: ClipboardCheck,
      colorClass: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/30',
      badgeVariant: 'outline',
    },
    awardedToConvert: {
      label: 'Awarded to Convert',
      description: 'Tenders won/appointed that have not yet been converted into projects.',
      icon: Trophy,
      colorClass: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30',
      badgeVariant: 'default',
    },
  };

  const getDaysUntil = (dateStr?: Date | null) => {
    if (!dateStr) return null;
    const now = new Date();
    const target = new Date(dateStr);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {/* 5-Category Action Queue Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {(Object.keys(queueConfig) as QueueType[]).map((key) => {
          const config = queueConfig[key];
          const list = queues[key];
          const isSelected = selectedQueue === key;
          const Icon = config.icon;

          return (
            <button
              key={key}
              onClick={() => setSelectedQueue(key)}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'border-foreground shadow-sm bg-accent/40 ring-1 ring-ring'
                  : 'bg-card border-border hover:border-muted-foreground/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-lg border bg-background ${isSelected ? 'border-foreground' : 'border-border'}`}>
                  <Icon className={`h-4 w-4 ${config.colorClass.split(' ')[0]}`} />
                </div>
                <Badge
                  variant={list.length > 0 ? config.badgeVariant : 'secondary'}
                  className={
                    list.length > 0
                      ? 'font-bold text-white px-2 py-0.5 min-w-[22px] justify-center'
                      : 'font-semibold text-foreground bg-accent/80 border border-border/60 px-2 py-0.5 min-w-[22px] justify-center'
                  }
                >
                  {list.length}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {key === 'closingSoon' ? 'Closing Soon' : config.label}
              </span>
              <span className="text-lg font-bold mt-1 tracking-tight">
                {list.length > 0 ? `${list.length} action${list.length > 1 ? 's' : ''}` : 'Cleared'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded List Panel */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3 border-b border-border bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {React.createElement(queueConfig[selectedQueue].icon, { className: 'h-5 w-5 ' + queueConfig[selectedQueue].colorClass.split(' ')[0] })}
                {queueConfig[selectedQueue].label}
              </CardTitle>
              <CardDescription className="mt-1">
                {queueConfig[selectedQueue].description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {queues[selectedQueue].length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-3">
                <Check className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">All caught up</h3>
              <p className="text-xs text-muted-foreground mt-1">
                No tenders require actions in this category.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border/60">
                    <TableHead className="w-[36%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tender & Client</TableHead>
                    <TableHead className="w-[20%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Description</TableHead>
                    <TableHead className="w-[14%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="w-[14%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Value</TableHead>
                    <TableHead className="w-[16%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {selectedQueue === 'overdue' && 'Passed Deadline'}
                      {selectedQueue === 'closingSoon' && 'Closing Date'}
                      {selectedQueue === 'briefingPending' && 'Briefing Info'}
                      {selectedQueue === 'awaitingResults' && 'Submitted Date'}
                      {selectedQueue === 'awardedToConvert' && 'Award Status'}
                    </TableHead>
                    <TableHead className="w-[10%] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queues[selectedQueue].map((t) => {
                    const daysLeft = getDaysUntil(t.submissionDate);
                    
                    return (
                      <TableRow
                        key={t.id}
                        className="transition-colors duration-150 border-b border-border/40 hover:bg-accent/40 cursor-pointer"
                        onClick={() => router.push(`/tenders/${t.id}`)}
                      >
                        {/* Tender & Client */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                              <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="font-semibold text-foreground text-sm truncate">
                                {t.client?.name || 'Unknown Client'}
                              </div>
                              <Link
                                href={`/tenders/${t.id}`}
                                className="text-xs font-mono text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 hover:underline transition-colors truncate w-fit"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {t.tenderNumber.toUpperCase()}
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Description */}
                        <TableCell className="py-3">
                          <p className="text-xs text-muted-foreground line-clamp-2" title={t.description || ''}>
                            {t.description || '—'}
                          </p>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell className="py-3">
                          <StatusBadge domain="tender" status={t.status} />
                        </TableCell>
                        
                        {/* Value */}
                        <TableCell className="py-3">
                          <span className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                            {t.value ? formatCurrency(Number(t.value)) : '—'}
                          </span>
                        </TableCell>

                        {/* Date / Context Cell */}
                        <TableCell className="py-3">
                          {selectedQueue === 'overdue' && (
                            <div className="flex flex-col text-xs gap-0.5">
                              <div className="font-semibold text-red-500 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                {t.submissionDate ? formatDate(t.submissionDate) : '—'}
                              </div>
                              {daysLeft !== null && (
                                <div className="text-[11px] text-red-500 font-semibold pl-5">
                                  {Math.abs(daysLeft)}d overdue
                                </div>
                              )}
                            </div>
                          )}

                          {selectedQueue === 'closingSoon' && (
                            <div className="flex flex-col text-xs gap-0.5">
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {t.submissionDate ? formatDate(t.submissionDate) : '—'}
                              </div>
                              {daysLeft !== null && (
                                <div className="text-[11px] pl-5 font-semibold text-amber-500">
                                  {daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                                </div>
                              )}
                            </div>
                          )}

                          {selectedQueue === 'briefingPending' && (
                            <div className="flex flex-col text-xs gap-0.5">
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {t.briefingDate ? formatDate(t.briefingDate) : '—'}
                              </div>
                              {t.briefingLocation && (
                                <div className="text-[11px] text-muted-foreground pl-5 truncate max-w-[140px]" title={t.briefingLocation}>
                                  {t.briefingLocation}
                                </div>
                              )}
                            </div>
                          )}

                          {selectedQueue === 'awaitingResults' && (
                            <div className="flex flex-col text-xs gap-0.5">
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {t.submissionDate ? formatDate(t.submissionDate) : '—'}
                              </div>
                              <div className="text-[11px] text-muted-foreground pl-5">Submitted</div>
                            </div>
                          )}

                          {selectedQueue === 'awardedToConvert' && (
                            <div className="flex flex-col text-xs gap-0.5">
                              <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <Trophy className="h-3.5 w-3.5 shrink-0" />
                                Awarded
                              </div>
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {selectedQueue === 'briefingPending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkBriefingAttended(t.id)}
                                disabled={isPending}
                                className="cursor-pointer text-xs h-7 px-2 hover:bg-blue-500 hover:text-white"
                              >
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Attended'}
                              </Button>
                            )}
                            {selectedQueue === 'awardedToConvert' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleConvertToProjectClick(t)}
                                disabled={isPending}
                                className="cursor-pointer text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Convert
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 cursor-pointer hover:bg-accent">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/tenders/${t.id}`)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/tenders/${t.id}/edit`)}>
                                  Edit Tender
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TenderToProjectDialog wrapper */}
      {activeTender && (
        <TenderToProjectDialog
          open={showAwardDialog}
          onOpenChange={setShowAwardDialog}
          tenderNumber={activeTender.tenderNumber}
          estimatedValue={activeTender.value}
          onSubmit={handleConvertToProjectSubmit}
          isPending={isPending}
        />
      )}
    </div>
  );
}
