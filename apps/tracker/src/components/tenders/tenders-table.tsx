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

function DaysLeftCell({ submissionDate, status, updatedAt }: { submissionDate: Date | null; status: string; updatedAt: Date }) {
  if (status === 'evaluation') {
    return <>Submitted {formatDate(updatedAt)}</>;
  }
  const daysLeft = getDaysUntilDeadline(submissionDate);
  if (daysLeft === null) return <>-</>;
  if (daysLeft < 0) return <span className="text-red-600 font-medium">{Math.abs(daysLeft)} days overdue</span>;
  if (daysLeft === 0) return <span className="text-orange-600 font-medium">Due today</span>;
  return <span className={daysLeft <= 3 ? 'text-orange-600 font-medium' : ''}>{daysLeft} days</span>;
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
            ? `Submitted ${formatDate(tender.updatedAt)}`
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
                identifier={tender.tenderNumber}
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
      {/* Desktop table */}
      <Table className="w-full min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Tender Number</TableHead>
            <TableHead className="min-w-[150px]">Client</TableHead>
            <TableHead className="min-w-[200px] hidden sm:table-cell">Description</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[100px] hidden md:table-cell">Value</TableHead>
            <TableHead className="min-w-[120px] hidden lg:table-cell">Closing Date</TableHead>
            <TableHead className="min-w-[100px] hidden sm:table-cell">Days Left</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => (
            <TableRow
              key={tender.id}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={() => onRowClick?.(tender.id)}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/tenders/${tender.id}`}
                  className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  onClick={(event) => event.stopPropagation()}
                >
                  {tender.tenderNumber}
                </Link>
              </TableCell>
              <TableCell>{tender.client?.name || 'Unknown Client'}</TableCell>
              <TableCell className="max-w-[200px] truncate hidden sm:table-cell">
                {tender.description || '-'}
              </TableCell>
              <TableCell><StatusBadge domain="tender" status={tender.status} /></TableCell>
              <TableCell className="hidden md:table-cell">
                {formatCurrency(Number(tender.value || 0))}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDate(tender.submissionDate)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <DaysLeftCell submissionDate={tender.submissionDate} status={tender.status} updatedAt={tender.updatedAt} />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 cursor-pointer">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewTender && (
                      <DropdownMenuItem onClick={() => onViewTender(tender.id)}>View</DropdownMenuItem>
                    )}
                    {onEditTender && (
                      <DropdownMenuItem onClick={() => onEditTender(tender.id)}>Edit</DropdownMenuItem>
                    )}
                    {onDeleteTender && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteTender(tender.id)} variant="destructive">
                          Delete
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
