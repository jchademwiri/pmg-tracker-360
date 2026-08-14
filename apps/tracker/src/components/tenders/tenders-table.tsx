'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from '@/components/ui/mobile-card';
import {
  MoreHorizontalIcon,
  Building2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/format';
import { DataTableShell } from '@/components/shared/tables/data-table-shell';

interface Tender {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
  } | null;
}

interface TendersTableProps {
  tenders: Tender[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewTender?: (tenderId: string) => void;
  onEditTender?: (tenderId: string) => void;
  onDeleteTender?: (tenderId: string) => void;
  onRowClick?: (tenderId: string) => void;
  className?: string;
}

function getDaysUntilDeadline(submissionDate: Date | null): number | null {
  if (!submissionDate) return null;
  const now = new Date();
  const diffTime = submissionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function DeadlineCell({ submissionDate, status, updatedAt }: { submissionDate: Date | null; status: string; updatedAt: Date }) {
  if (status === 'evaluation') {
    return (
      <div className="flex flex-col text-xs gap-0.5">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {submissionDate ? formatDate(submissionDate) : '—'}
        </div>
        <div className="text-muted-foreground text-[11px] pl-5">Submitted {formatDate(updatedAt)}</div>
      </div>
    );
  }
  if (!submissionDate) return <span className="text-muted-foreground text-xs">-</span>;
  const daysLeft = getDaysUntilDeadline(submissionDate);

  let badge = null;
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      badge = <span className="text-red-500 dark:text-red-400 font-semibold">{Math.abs(daysLeft)}d overdue</span>;
    } else if (daysLeft === 0) {
      badge = <span className="text-amber-500 font-semibold">Due today</span>;
    } else {
      badge = <span className={daysLeft <= 3 ? 'text-amber-500 font-semibold' : 'text-muted-foreground'}>{daysLeft}d left</span>;
    }
  }

  return (
    <div className="flex flex-col text-xs gap-0.5">
      <div className="font-semibold text-foreground flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {formatDate(submissionDate)}
      </div>
      {badge && <div className="text-[11px] pl-5">{badge}</div>}
    </div>
  );
}

export function TendersTable({
  tenders,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onViewTender,
  onEditTender,
  onDeleteTender,
  onRowClick,
  className = '',
}: TendersTableProps) {
  return (
    <DataTableShell
      title="Tenders"
      entityLabel="tenders"
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      dataLength={tenders.length}
      emptyState={{
        type: 'empty',
        icon: 'file',
        title: 'No tenders found',
        description: 'Get started by creating your first tender.',
        actionLabel: 'Add Tender',
        actionHref: '/tenders/create',
      }}
      className={className}
      mobileContent={
        <MobileCardList>
        {tenders.map((tender) => {
          const daysLeft = getDaysUntilDeadline(tender.submissionDate);
          const actions = [
            ...(onViewTender ? [{ label: 'View' as const, onClick: () => onViewTender(tender.id) }] : []),
            ...(onEditTender ? [{ label: 'Edit' as const, onClick: () => onEditTender(tender.id) }] : []),
            ...(onDeleteTender ? [{ label: 'Delete' as const, onClick: () => onDeleteTender(tender.id), variant: 'destructive' as const }] : []),
          ];

          const daysLeftContent = tender.status === 'evaluation'
            ? `Closing ${tender.submissionDate ? formatDate(tender.submissionDate) : '—'} · Submitted ${formatDate(tender.updatedAt)}`
            : daysLeft === null
              ? '-'
              : daysLeft < 0
                ? `${Math.abs(daysLeft)} days overdue`
                : daysLeft === 0
                  ? 'Due today'
                  : `${daysLeft} days left`;

          return (
            <MobileCard key={tender.id} onClick={() => onRowClick?.(tender.id)}>
              <MobileCardHeader
                identifier={tender.tenderNumber.toUpperCase()}
                status={tender.status}
                actions={actions}
              />
              <MobileCardBody>
                <h3 className="font-semibold text-foreground text-sm">
                  {tender.client?.name || 'Unknown Client'}
                </h3>
                {tender.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{tender.description}</p>
                )}
                <MobileCardGrid>
                  <MobileCardField label="Value">{formatCurrency(Number(tender.value || 0))}</MobileCardField>
                  <MobileCardField label="Closing Date">{formatDate(tender.submissionDate)}</MobileCardField>
                  <MobileCardField label="Time Left" className="col-span-2">
                    {daysLeftContent}
                  </MobileCardField>
                </MobileCardGrid>
              </MobileCardBody>
            </MobileCard>
          );
        })}
        </MobileCardList>
      }
    >
      {/* Desktop table with explicit table-fixed column widths */}
      <Table className="w-full table-fixed">
        <TableHeader className="bg-primary">
          <TableRow className="hover:bg-transparent border-b border-primary">
            <TableHead className="w-[42%] font-semibold text-xs uppercase tracking-wider text-primary-foreground">Tender & Client</TableHead>
            <TableHead className="w-[16%] font-semibold text-xs uppercase tracking-wider text-primary-foreground">Status</TableHead>
            <TableHead className="w-[17%] font-semibold text-xs uppercase tracking-wider text-primary-foreground">Value</TableHead>
            <TableHead className="w-[18%] font-semibold text-xs uppercase tracking-wider text-primary-foreground">Deadline</TableHead>
            <TableHead className="w-[7%] text-right font-semibold text-xs uppercase tracking-wider text-primary-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow
              key={tender.id}
              className={`transition-colors duration-150 border-b border-border/40 ${
                onRowClick ? 'cursor-pointer hover:bg-accent/40' : ''
              }`}
              onClick={() => onRowClick?.(tender.id)}
            >
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                    <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">
                      {tender.client?.name || 'Unknown Client'}
                    </div>
                    <Link
                      href={`/tenders/${tender.id}`}
                      className="text-xs font-mono text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 hover:underline transition-colors truncate w-fit"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {tender.tenderNumber.toUpperCase()}
                    </Link>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <StatusBadge domain="tender" status={tender.status} />
              </TableCell>
              <TableCell className="py-3">
                <span className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(tender.value || 0))}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <DeadlineCell submissionDate={tender.submissionDate} status={tender.status} updatedAt={tender.updatedAt} />
              </TableCell>
              <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 cursor-pointer hover:bg-accent">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewTender && (
                      <DropdownMenuItem onClick={() => onViewTender(tender.id)}>View Details</DropdownMenuItem>
                    )}
                    {onEditTender && (
                      <DropdownMenuItem onClick={() => onEditTender(tender.id)}>Edit Tender</DropdownMenuItem>
                    )}
                    {onDeleteTender && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteTender(tender.id)} variant="destructive">
                          Delete Tender
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}
