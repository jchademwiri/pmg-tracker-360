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
import { formatCurrency, formatDate } from '@/lib/format';
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
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[700px]">
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    {/* Columns headers based on selected queue */}
                    {selectedQueue === 'highRisks' ? (
                      <>
                        <TableHead className="py-3 pl-4 font-semibold text-xs text-muted-foreground">Project</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Risk Title</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Description</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Severity</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Logged Date</TableHead>
                      </>
                    ) : selectedQueue === 'closeOutCandidates' ? (
                      <>
                        <TableHead className="py-3 pl-4 font-semibold text-xs text-muted-foreground">Project Number</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Client</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Description</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Contract End Date</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Reason</TableHead>
                      </>
                    ) : (
                      // PO delivery columns
                      <>
                        <TableHead className="py-3 pl-4 font-semibold text-xs text-muted-foreground">PO Number</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Project</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Client</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Amount</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Expected Date</TableHead>
                        <TableHead className="py-3 font-semibold text-xs text-muted-foreground">Status</TableHead>
                      </>
                    )}
                    <TableHead className="py-3 pr-4 text-right font-semibold text-xs text-muted-foreground w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Overdue/Partial Deliveries */}
                  {(selectedQueue === 'overdueDeliveries' || selectedQueue === 'partialDeliveries') && 
                    (queues[selectedQueue] as ActionQueuePO[]).map((po) => (
                      <TableRow key={po.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="py-3 pl-4 font-medium text-sm">
                          <Link
                            href={`/projects/purchase-orders/${po.id}`}
                            className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
                          >
                            {po.poNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 text-sm font-semibold">
                          <Link
                            href={`/projects/${po.project.id}`}
                            className="text-foreground hover:underline"
                          >
                            {po.project.projectNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {po.client?.name || '—'}
                        </TableCell>
                        <TableCell className="py-3 text-sm font-medium">
                          {po.totalAmount ? formatCurrency(po.totalAmount) : '—'}
                        </TableCell>
                        <TableCell className={`py-3 text-sm font-medium ${selectedQueue === 'overdueDeliveries' ? 'text-red-500' : ''}`}>
                          {po.expectedDeliveryDate ? formatDate(new Date(po.expectedDeliveryDate)) : '—'}
                        </TableCell>
                        <TableCell className="py-3 text-sm">
                          <StatusBadge domain="purchaseOrder" status={po.status} />
                        </TableCell>
                        <TableCell className="py-2 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                      <TableRow key={risk.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="py-3 pl-4 font-semibold text-sm">
                          <Link
                            href={`/projects/${risk.project.id}`}
                            className="text-foreground hover:underline"
                          >
                            {risk.project.projectNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 text-sm font-medium">
                          {risk.title}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground max-w-[250px] truncate" title={risk.description || ''}>
                          {risk.description || '—'}
                        </TableCell>
                        <TableCell className="py-3 text-sm">
                          <StatusBadge domain="risk" status={risk.severity} />
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {formatDate(new Date(risk.createdAt))}
                        </TableCell>
                        <TableCell className="py-2 pr-4 text-right">
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
                      <TableRow key={proj.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="py-3 pl-4 font-medium text-sm">
                          <Link
                            href={`/projects/${proj.id}`}
                            className="text-blue-500 hover:text-blue-600 hover:underline font-semibold"
                          >
                            {proj.projectNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {proj.client?.name || '—'}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground max-w-[200px] truncate" title={proj.description || ''}>
                          {proj.description || '—'}
                        </TableCell>
                        <TableCell className="py-3 text-sm font-medium">
                          {proj.contractEndDate ? formatDate(new Date(proj.contractEndDate)) : '—'}
                        </TableCell>
                        <TableCell className="py-3 text-sm font-medium text-amber-500">
                          {proj.candidateReason}
                        </TableCell>
                        <TableCell className="py-2 pr-4 text-right">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
