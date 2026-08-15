'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AlertTriangle,
  Clock,
  Eye,
  Check,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Archive,
  Truck
} from 'lucide-react';
import { formatCurrency, formatDate, formatClientName, toTitleCase } from '@/lib/format';
import Link from 'next/link';

interface ActionQueuePO {
  id: string;
  poNumber: string;
  description: string | null;
  totalAmount: string | null;
  status: string;
  expectedDeliveryDate: Date | null;
  project: {
    id: string;
    projectNumber: string;
  };
  client: {
    name: string;
  } | null;
}

interface ActionQueueRisk {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  createdAt: Date;
  project: {
    id: string;
    projectNumber: string;
  };
}

interface ActionQueueProjectCandidate {
  id: string;
  projectNumber: string;
  description: string | null;
  contractEndDate: Date | null;
  status: string;
  client: {
    name: string;
  } | null;
  candidateReason: string;
}

interface ProjectActionQueueData {
  overdueDeliveries: ActionQueuePO[];
  partialDeliveries: ActionQueuePO[];
  highRisks: ActionQueueRisk[];
  closeOutCandidates: ActionQueueProjectCandidate[];
}

interface ProjectActionQueueProps {
  organizationId: string;
  initialQueues: ProjectActionQueueData;
}

type QueueType = keyof ProjectActionQueueData;

export function ProjectActionQueue({ organizationId, initialQueues }: ProjectActionQueueProps) {
  const [queues] = useState<ProjectActionQueueData>(initialQueues);
  const [selectedQueue, setSelectedQueue] = useState<QueueType>(() => {
    if (initialQueues.overdueDeliveries.length > 0) return 'overdueDeliveries';
    if (initialQueues.partialDeliveries.length > 0) return 'partialDeliveries';
    if (initialQueues.highRisks.length > 0) return 'highRisks';
    if (initialQueues.closeOutCandidates.length > 0) return 'closeOutCandidates';
    return 'overdueDeliveries';
  });

  const queueConfig: Record<QueueType, {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    badgeVariant: 'destructive' | 'secondary' | 'outline' | 'default';
  }> = {
    overdueDeliveries: {
      label: 'Overdue Deliveries',
      description: 'Active purchase orders with expected delivery dates in the past.',
      icon: AlertTriangle,
      colorClass: 'text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30',
      badgeVariant: 'destructive',
    },
    partialDeliveries: {
      label: 'Partial Deliveries',
      description: 'Purchase orders with status partially delivered.',
      icon: Truck,
      colorClass: 'text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30',
      badgeVariant: 'default',
    },
    highRisks: {
      label: 'High/Critical Risks',
      description: 'Active risks on active projects with high or critical severity.',
      icon: ShieldAlert,
      colorClass: 'text-rose-500 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30',
      badgeVariant: 'destructive',
    },
    closeOutCandidates: {
      label: 'Close-out Candidates',
      description: 'Active projects with contract end date in the past, or all POs fully delivered.',
      icon: Archive,
      colorClass: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30',
      badgeVariant: 'default',
    },
  };

  return (
    <div className="space-y-4">
      {/* 4-Category Action Queue Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                {config.label}
              </span>
              <span className="text-lg font-bold mt-1 tracking-tight">
                {list.length > 0 ? `${list.length} item${list.length > 1 ? 's' : ''}` : 'Cleared'}
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
                No items require actions in this category.
              </p>
            </div>
          ) : (
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  {/* Columns headers based on selected queue */}
                  {selectedQueue === 'highRisks' ? (
                    <>
                      <TableHead className="pl-6 w-[25%]">Project</TableHead>
                      <TableHead className="w-[25%]">Risk Title</TableHead>
                      <TableHead className="w-[25%]">Description</TableHead>
                      <TableHead className="w-[12%]">Severity</TableHead>
                      <TableHead className="w-[13%]">Logged Date</TableHead>
                    </>
                  ) : selectedQueue === 'closeOutCandidates' ? (
                    <>
                      <TableHead className="pl-6 w-[20%]">Project #</TableHead>
                      <TableHead className="w-[22%]">Client</TableHead>
                      <TableHead className="w-[26%]">Description</TableHead>
                      <TableHead className="w-[16%]">Contract End Date</TableHead>
                      <TableHead className="w-[16%]">Reason</TableHead>
                    </>
                  ) : (
                    // PO delivery columns
                    <>
                      <TableHead className="pl-6 w-[20%]">PO Number</TableHead>
                      <TableHead className="w-[18%]">Project</TableHead>
                      <TableHead className="w-[22%]">Client</TableHead>
                      <TableHead className="w-[15%]">Total Amount</TableHead>
                      <TableHead className="w-[13%]">Expected Date</TableHead>
                      <TableHead className="w-[12%]">Status</TableHead>
                    </>
                  )}
                  <TableHead className="pr-6 text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Overdue/Partial Deliveries */}
                {(selectedQueue === 'overdueDeliveries' || selectedQueue === 'partialDeliveries') && 
                  (queues[selectedQueue] as ActionQueuePO[]).map((po) => (
                    <TableRow key={po.id} className="cursor-default">
                      <TableCell className="pl-6 font-mono font-bold text-xs">
                        <Link
                          href={`/projects/purchase-orders/${po.id}`}
                          className="text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          {po.poNumber.toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold">
                        <Link
                          href={`/projects/${po.project.id}`}
                          className="text-foreground hover:underline"
                        >
                          {po.project.projectNumber.toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate">
                        {formatClientName(po.client?.name) || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold tabular-nums text-foreground">
                        {po.totalAmount ? formatCurrency(po.totalAmount) : '—'}
                      </TableCell>
                      <TableCell className={`text-xs font-medium ${selectedQueue === 'overdueDeliveries' ? 'text-rose-400 font-bold' : 'text-muted-foreground'}`}>
                        {po.expectedDeliveryDate ? formatDate(new Date(po.expectedDeliveryDate)) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge domain="purchaseOrder" status={po.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="cursor-pointer text-xs h-7 px-2"
                          >
                            <Link href={`/projects/purchase-orders/${po.id}/deliveries/new`}>
                              Log Delivery
                            </Link>
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            asChild
                            className="h-7 w-7 cursor-pointer"
                          >
                            <Link href={`/projects/purchase-orders/${po.id}`}>
                              <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                }

                {/* High/Critical Risks */}
                {selectedQueue === 'highRisks' && 
                  (queues.highRisks as ActionQueueRisk[]).map((risk) => (
                    <TableRow key={risk.id} className="cursor-default">
                      <TableCell className="pl-6 font-mono font-bold text-xs">
                        <Link
                          href={`/projects/${risk.project.id}`}
                          className="text-foreground hover:underline"
                        >
                          {risk.project.projectNumber.toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {risk.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={risk.description || ''}>
                        {risk.description ? toTitleCase(risk.description) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge domain="risk" status={risk.severity} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(new Date(risk.createdAt))}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="cursor-pointer text-xs h-7 px-2"
                        >
                          <Link href={`/projects/${risk.project.id}`}>
                            Manage Risk
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                }

                {/* Close-out Candidates */}
                {selectedQueue === 'closeOutCandidates' && 
                  (queues.closeOutCandidates as ActionQueueProjectCandidate[]).map((proj) => (
                    <TableRow key={proj.id} className="cursor-default">
                      <TableCell className="pl-6 font-mono font-bold text-xs">
                        <Link
                          href={`/projects/${proj.id}`}
                          className="text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          {proj.projectNumber.toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate">
                        {formatClientName(proj.client?.name) || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate" title={proj.description || ''}>
                        {proj.description ? toTitleCase(proj.description) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {proj.contractEndDate ? formatDate(new Date(proj.contractEndDate)) : '—'}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-amber-400">
                        {proj.candidateReason}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="default"
                          asChild
                          className="cursor-pointer text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Link href={`/projects/${proj.id}`}>
                            Workspace
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
