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
  Loader2
} from 'lucide-react';
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
                <Badge variant={config.badgeVariant} className={list.length > 0 ? '' : 'bg-muted text-muted-foreground'}>
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
              <Table className="w-full min-w-[700px]">
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="py-3 pl-4 font-semibold text-xs text-muted-foreground">Tender Number</TableHead>
                    <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Client</TableHead>
                    <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Description</TableHead>
                    
                    {/* Conditional Headers */}
                    {selectedQueue === 'overdue' && (
                      <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Passed Deadline</TableHead>
                    )}
                    {selectedQueue === 'closingSoon' && (
                      <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Days Left</TableHead>
                    )}
                    {selectedQueue === 'briefingPending' && (
                      <>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Briefing Date</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Location</TableHead>
                      </>
                    )}
                    {selectedQueue === 'awaitingResults' && (
                      <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Submitted Date</TableHead>
                    )}
                    
                    <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Value</TableHead>
                    <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Current Status</TableHead>
                    <TableHead className="py-3 pr-4 text-right font-semibold text-xs text-muted-foreground w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queues[selectedQueue].map((t) => {
                    const daysLeft = getDaysUntil(t.submissionDate);
                    
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/5 transition-colors">
                        {/* Tender Number */}
                        <TableCell className="py-3 pl-4 font-medium text-sm">
                          <Link
                            href={`/tenders/${t.id}`}
                            className="text-blue-500 hover:text-blue-600 hover:underline font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                          >
                            {t.tenderNumber}
                          </Link>
                        </TableCell>
                        
                        {/* Client */}
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {t.client?.name || 'Unknown Client'}
                        </TableCell>
                        
                        {/* Description */}
                        <TableCell className="py-3 text-sm max-w-[200px] truncate" title={t.description || ''}>
                          {t.description || '—'}
                        </TableCell>
                        
                        {/* Conditional Columns */}
                        {selectedQueue === 'overdue' && (
                          <TableCell className="py-3 text-sm text-red-500 font-medium">
                            {t.submissionDate ? formatDate(t.submissionDate) : '—'}
                          </TableCell>
                        )}
                        {selectedQueue === 'closingSoon' && (
                          <TableCell className="py-3 text-sm font-medium">
                            {daysLeft !== null ? (
                              daysLeft === 0 ? (
                                <span className="text-red-500 animate-pulse font-semibold">Today</span>
                              ) : daysLeft === 1 ? (
                                <span className="text-red-500 font-medium">Tomorrow</span>
                              ) : (
                                <span className={daysLeft <= 3 ? 'text-orange-500 font-medium' : 'text-amber-500'}>
                                  {daysLeft} days
                                </span>
                              )
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        )}
                        {selectedQueue === 'briefingPending' && (
                          <>
                            <TableCell className="py-3 text-sm">
                              {t.briefingDate ? formatDate(t.briefingDate) : '—'}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground truncate max-w-[150px]">
                              {t.briefingLocation || '—'}
                            </TableCell>
                          </>
                        )}
                        {selectedQueue === 'awaitingResults' && (
                          <TableCell className="py-3 text-sm text-muted-foreground">
                            {t.submissionDate ? formatDate(t.submissionDate) : '—'}
                          </TableCell>
                        )}

                        {/* Value */}
                        <TableCell className="py-3 text-sm font-medium">
                          {t.value ? formatCurrency(t.value) : '—'}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 text-sm">
                          <StatusBadge domain="tender" status={t.status} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-2 pr-4 text-right">
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
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              asChild
                              className="h-7 w-7 cursor-pointer"
                            >
                              <Link href={`/tenders/${t.id}`}>
                                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </Link>
                            </Button>
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
