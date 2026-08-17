'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  FileDown,
  Trash2,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Building,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  formatCurrency,
  formatDate as sharedFormatDate,
  formatDateTime,
  formatClientName,
} from '@/lib/format';
import { toast } from 'sonner';

interface TenderHeroHeaderProps {
  tender: {
    id: string;
    tenderNumber: string;
    description: string | null;
    submissionDate: Date | null;
    value: string | null;
    awardValue: string | null;
    status: string;
    evaluationDate: Date | null;
    validityDays: number | null;
    validityDate: Date | null;
    client: {
      id: string;
      name: string;
      contactName?: string | null;
    } | null;
  };
  isPending: boolean;
  onEdit: () => void;
  onExportPdf: () => void;
  onDelete: () => void;
  onOpenAwardDialog: () => void;
  onOpenLostDialog: () => void;
  onOpenFollowUpDialog: () => void;
  onStatusUpdate: (
    newStatus:
      | 'new'
      | 'review'
      | 'approved_to_prepare'
      | 'preparation'
      | 'ready'
      | 'submitted'
      | 'evaluation'
      | 'awarded'
      | 'lost'
      | 'cancelled'
      | 'closed'
      | 'open'
  ) => void;
}

export function TenderHeroHeader({
  tender,
  isPending,
  onEdit,
  onExportPdf,
  onDelete,
  onOpenAwardDialog,
  onOpenLostDialog,
  onOpenFollowUpDialog,
  onStatusUpdate,
}: TenderHeroHeaderProps) {
  // Stepper lifecycle configuration
  const stages = [
    { value: 'new', label: 'Opportunity' },
    { value: 'review', label: 'To Review' },
    { value: 'approved_to_prepare', label: 'Approved' },
    { value: 'preparation', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'awarded', label: tender.status === 'lost' ? 'Lost' : 'Awarded' },
  ];

  const getStatusIndex = (status: string) => {
    switch (status) {
      case 'new':
      case 'open':
        return 0;
      case 'review':
        return 1;
      case 'approved_to_prepare':
        return 2;
      case 'preparation':
        return 3;
      case 'ready':
        return 4;
      case 'submitted':
        return 5;
      case 'evaluation':
        return 6;
      case 'awarded':
      case 'lost':
        return 7;
      default:
        return -1;
    }
  };

  const currentStatusIndex = getStatusIndex(tender.status);

  const handleStageClick = (stageValue: string) => {
    if (stageValue === tender.status) return;
    if (stageValue === 'new' && tender.status === 'open') return;
    if (stageValue === 'awarded') {
      onOpenAwardDialog();
      return;
    }
    if (stageValue === 'lost') {
      onOpenLostDialog();
      return;
    }
    if (['submitted', 'evaluation'].includes(stageValue) && !tender.submissionDate) {
      toast.error('A submission date is required before transitioning to Submitted or Evaluation.');
      return;
    }
    if (['approved_to_prepare', 'preparation'].includes(stageValue) && !tender.client?.id) {
      toast.error('A client must be assigned before transitioning to Approved or Preparing.');
      return;
    }
    onStatusUpdate(stageValue as any);
  };

  const getStageDisabledReason = (stageValue: string): string | null => {
    if (stageValue === tender.status || (stageValue === 'new' && tender.status === 'open')) {
      return 'Current stage';
    }
    const finalizedStatuses = ['awarded', 'lost', 'closed', 'cancelled'];
    if (
      finalizedStatuses.includes(tender.status) &&
      ['new', 'review', 'approved_to_prepare', 'preparation', 'ready', 'open'].includes(stageValue)
    ) {
      return 'Cannot revert a finalized tender';
    }
    if (['submitted', 'evaluation'].includes(stageValue) && !tender.submissionDate) {
      return 'Submission date required';
    }
    if (['approved_to_prepare', 'preparation'].includes(stageValue) && !tender.client?.id) {
      return 'Client required';
    }
    return null;
  };

  const isStageDisabled = (stageValue: string): boolean => {
    return getStageDisabledReason(stageValue) !== null;
  };

  // Helper for copy tender reference
  const handleCopyTenderNumber = () => {
    navigator.clipboard.writeText(tender.tenderNumber);
    toast.success('Tender reference copied to clipboard');
  };

  const handleCopyPageUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tender page link copied to clipboard');
  };

  // Calculations for KPI Cards
  const now = new Date();

  // Closing date calculations
  const closingDateObj = tender.submissionDate ? new Date(tender.submissionDate) : null;
  let closingUrgency: { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'warning' } = {
    label: 'No deadline set',
    variant: 'secondary',
  };

  if (closingDateObj) {
    const diffTime = closingDateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (['awarded', 'lost', 'closed', 'cancelled'].includes(tender.status)) {
      closingUrgency = { label: 'Completed', variant: 'secondary' };
    } else if (tender.status === 'submitted' || tender.status === 'evaluation') {
      closingUrgency = { label: 'Submitted on time', variant: 'default' };
    } else if (diffDays < 0) {
      closingUrgency = { label: `Overdue by ${Math.abs(diffDays)}d`, variant: 'destructive' };
    } else if (diffDays === 0) {
      closingUrgency = { label: 'Closing Today', variant: 'destructive' };
    } else if (diffDays === 1) {
      closingUrgency = { label: 'Closing Tomorrow', variant: 'warning' };
    } else if (diffDays <= 7) {
      closingUrgency = { label: `${diffDays} days left`, variant: 'warning' };
    } else {
      closingUrgency = { label: `${diffDays} days left`, variant: 'outline' };
    }
  }

  // Validity calculations
  const validityDateObj = tender.evaluationDate
    ? new Date(tender.evaluationDate)
    : tender.validityDate
      ? new Date(tender.validityDate)
      : null;

  let validityStatusText = 'No validity date';
  let validityDaysLeft: number | null = null;
  if (validityDateObj) {
    const diffTime = validityDateObj.getTime() - now.getTime();
    validityDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (validityDaysLeft < 0) {
      validityStatusText = `Expired ${Math.abs(validityDaysLeft)}d ago`;
    } else if (validityDaysLeft === 0) {
      validityStatusText = 'Expires today';
    } else {
      validityStatusText = `${validityDaysLeft} days remaining`;
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/tenders">
            <Button variant="ghost" size="sm" className="cursor-pointer text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Tenders
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {tender.tenderNumber.toUpperCase()}
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={handleCopyTenderNumber}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy tender reference</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <StatusBadge domain="tender" status={tender.status} />
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFollowUpDialog}
            className="cursor-pointer border-border/80 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
            Log Follow-up
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportPdf}
            className="cursor-pointer border-border/80 shadow-xs"
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Export PDF
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onEdit}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit Tender
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer shadow-xs">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleCopyPageUrl} className="cursor-pointer">
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyTenderNumber} className="cursor-pointer">
                <Copy className="h-4 w-4 mr-2" />
                Copy Ref Code
              </DropdownMenuItem>
              {tender.client && (
                <DropdownMenuItem asChild>
                  <Link href={`/clients/${tender.client.id}`} className="cursor-pointer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Client Hub
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600 cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tender
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Integrated Compact Lifecycle Stepper (Sleek Rail) */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Workflow Stage
            </span>
            <span className="text-xs font-medium text-foreground">
              {stages[currentStatusIndex]?.label || 'Active'}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Click any eligible milestone to advance
          </span>
        </div>

        {/* Desktop / Tablet Stepper Rail */}
        <div className="hidden sm:grid grid-cols-8 gap-1.5 relative">
          {stages.map((stage, idx) => {
            const isCompleted = currentStatusIndex >= 0 && idx < currentStatusIndex;
            const isActive = idx === currentStatusIndex;
            const isTerminal = stage.value === 'awarded';
            const isLost = tender.status === 'lost' && isTerminal;
            const disabled = isStageDisabled(stage.value);
            const disableReason = getStageDisabledReason(stage.value);

            let bgClass = 'bg-muted/40 hover:bg-muted/80 text-muted-foreground border-border/40';
            if (isCompleted) {
              bgClass = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
            } else if (isActive) {
              bgClass = isLost
                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40 ring-2 ring-red-500/20 font-semibold'
                : 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20 font-semibold shadow-xs';
            }

            return (
              <TooltipProvider key={stage.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleStageClick(stage.value)}
                      disabled={isPending || disabled}
                      className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${bgClass}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] shrink-0 ${
                          isActive && !isLost
                            ? 'bg-white text-blue-600 font-bold'
                            : isCompleted
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted-foreground/20 text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </span>
                      <span className="truncate">{stage.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {disabled
                      ? disableReason || 'Stage transition locked'
                      : `Transition to ${stage.label}`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Mobile Stepper (Horizontal Scroll / Compact Pills) */}
        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {stages.map((stage, idx) => {
            const isCompleted = currentStatusIndex >= 0 && idx < currentStatusIndex;
            const isActive = idx === currentStatusIndex;
            const disabled = isStageDisabled(stage.value);

            let pillStyle = 'bg-muted/40 text-muted-foreground border-border/40';
            if (isCompleted) {
              pillStyle = 'bg-blue-500/15 text-blue-600 border-blue-500/30';
            } else if (isActive) {
              pillStyle = 'bg-blue-600 text-white border-blue-600 font-semibold';
            }

            return (
              <button
                key={stage.value}
                type="button"
                onClick={() => !disabled && handleStageClick(stage.value)}
                disabled={isPending || disabled}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${pillStyle}`}
              >
                {isCompleted && <span>✓</span>}
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Above-the-Fold 4-Tile Hero KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Tender Value / Award Value */}
        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              {tender.status === 'awarded' && tender.awardValue ? 'Award Value' : 'Estimated Value'}
            </span>
            <p className="text-lg font-bold tracking-tight text-foreground">
              {formatCurrency(tender.status === 'awarded' && tender.awardValue ? tender.awardValue : tender.value)}
            </p>
            {tender.status === 'awarded' && tender.value && tender.awardValue && (
              <p className="text-[11px] text-muted-foreground">
                Est: {formatCurrency(tender.value)}
              </p>
            )}
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Closing Date & Urgency Countdown */}
        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-500" />
                Closing Date
              </span>
              {closingDateObj && (
                <Badge
                  variant={
                    closingUrgency.variant === 'destructive'
                      ? 'destructive'
                      : closingUrgency.variant === 'warning'
                        ? 'default'
                        : 'secondary'
                  }
                  className={`text-[9px] px-1.5 py-0 h-4 font-semibold ${
                    closingUrgency.variant === 'warning'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : ''
                  }`}
                >
                  {closingUrgency.label}
                </Badge>
              )}
            </div>
            <p className="text-base font-bold tracking-tight text-foreground truncate">
              {closingDateObj ? sharedFormatDate(closingDateObj) : 'Not specified'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {closingDateObj ? formatDateTime(closingDateObj).split(',')[1] || '' : 'No closing time set'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Current Validity & Expiry */}
        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-amber-500" />
                Validity Status
              </span>
              {validityDaysLeft !== null && (
                <span
                  className={`text-[9px] px-1.5 py-0 rounded-full font-semibold ${
                    validityDaysLeft < 0
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                      : validityDaysLeft <= 14
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {validityStatusText}
                </span>
              )}
            </div>
            <p className="text-base font-bold tracking-tight text-foreground truncate">
              {validityDateObj ? sharedFormatDate(validityDateObj) : tender.validityDays ? `${tender.validityDays} Days` : 'Not recorded'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {tender.validityDays ? `Initial: ${tender.validityDays} days` : 'Standard validity'}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Client & Account */}
        <div className="rounded-xl border border-border/60 bg-card p-3.5 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 pr-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Building className="h-3 w-3 text-violet-500" />
              Client / Buyer
            </span>
            {tender.client ? (
              <>
                <Link
                  href={`/clients/${tender.client.id}`}
                  className="text-base font-bold tracking-tight text-foreground hover:text-blue-600 truncate block transition-colors"
                >
                  {formatClientName(tender.client.name)}
                </Link>
                <p className="text-[11px] text-muted-foreground truncate">
                  {tender.client.contactName || 'No contact assigned'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-muted-foreground italic">No Client Assigned</p>
                <p className="text-[11px] text-muted-foreground">Attach client via Edit</p>
              </>
            )}
          </div>
          <div className="h-9 w-9 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <Building className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
