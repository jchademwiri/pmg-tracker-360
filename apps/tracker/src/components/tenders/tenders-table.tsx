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
import { ListPagination } from '@/components/shared/pagination';

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
  const startItem = (currentPage - 1) * 20 + 1;
  const endItem = Math.min(currentPage * 20, totalCount);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Tenders</h2>
        <span className="text-sm text-muted-foreground">
          {totalCount > 0
            ? `${startItem}-${endItem} of ${totalCount}`
            : 'No tenders'}
        </span>
      </div>
      {tenders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tenders found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto hidden md:block">
            <Table className="w-full min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">
                        Tender Number
                      </TableHead>
                      <TableHead className="min-w-[150px]">Client</TableHead>
                      <TableHead className="min-w-[200px] hidden sm:table-cell">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px] hidden md:table-cell">
                        Value
                      </TableHead>
                      <TableHead className="min-w-[120px] hidden lg:table-cell">
                        Closing Date
                      </TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">
                        Days Left
                      </TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenders.map((tender) => {
                      const daysLeft = getDaysUntilDeadline(
                        tender.submissionDate
                      );
                      return (
                        <TableRow
                           key={tender.id}
                           className={
                             onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                           }
                           onClick={() => onRowClick?.(tender.id)}
                         >
                           <TableCell className="font-medium">
                             <Link
                               href={`/tenders/${tender.id}`}
                               className="text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                               onClick={(event) => event.stopPropagation()}
                             >
                               {tender.tenderNumber}
                             </Link>
                           </TableCell>
                           <TableCell>
                             {tender.client?.name || 'Unknown Client'}
                           </TableCell>
                           <TableCell className="max-w-[200px] truncate hidden sm:table-cell">
                             {tender.description || '-'}
                           </TableCell>
                           <TableCell>
                             <StatusBadge status={tender.status} />
                           </TableCell>
                           <TableCell className="hidden md:table-cell">
                             {formatCurrency(Number(tender.value || 0))}
                           </TableCell>
                           <TableCell className="hidden lg:table-cell">
                             {formatDate(tender.submissionDate)}
                           </TableCell>
                           <TableCell className="hidden sm:table-cell">
                             {tender.status === 'evaluation' ? (
                               (() => {
                                 const submissionDate = tender.updatedAt;
                                 return `Submitted ${formatDate(submissionDate)}`;
                               })()
                             ) : daysLeft === null ? (
                               '-'
                             ) : daysLeft < 0 ? (
                               <span className="text-red-600 font-medium">
                                 {Math.abs(daysLeft)} days overdue
                               </span>
                             ) : daysLeft === 0 ? (
                               <span className="text-orange-600 font-medium">
                                 Due today
                               </span>
                             ) : (
                               <span
                                 className={
                                   daysLeft <= 3
                                     ? 'text-orange-600 font-medium'
                                     : ''
                                 }
                               >
                                 {daysLeft} days
                               </span>
                             )}
                           </TableCell>
                           <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="size-8 cursor-pointer"
                                 >
                                   <MoreHorizontalIcon className="h-4 w-4" />
                                   <span className="sr-only">Open menu</span>
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 {onViewTender && (
                                   <DropdownMenuItem
                                     onClick={() => onViewTender(tender.id)}
                                   >
                                     View
                                   </DropdownMenuItem>
                                 )}
                                 {onEditTender && (
                                   <DropdownMenuItem
                                     onClick={() => onEditTender(tender.id)}
                                   >
                                     Edit
                                   </DropdownMenuItem>
                                 )}
                                 {onDeleteTender && (
                                   <>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem
                                       onClick={() => onDeleteTender(tender.id)}
                                       variant="destructive"
                                     >
                                       Delete
                                     </DropdownMenuItem>
                                   </>
                                 )}
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </TableCell>
                         </TableRow>
                       );
                     })}
                   </TableBody>
                 </Table>
               </div>

          {/* Mobile Card Layout */}
          <MobileCardList>
            {tenders.map((tender) => {
              const daysLeft = getDaysUntilDeadline(tender.submissionDate);
              const actions = [
                ...(onViewTender ? [{ label: 'View', onClick: () => onViewTender(tender.id) }] : []),
                ...(onEditTender ? [{ label: 'Edit', onClick: () => onEditTender(tender.id) }] : []),
                ...(onDeleteTender ? [{ label: 'Delete', onClick: () => onDeleteTender(tender.id), variant: 'destructive' as const }] : []),
              ];

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
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tender.description}
                      </p>
                    )}
                    <MobileCardGrid>
                      <MobileCardField label="Value">
                        {formatCurrency(Number(tender.value || 0))}
                      </MobileCardField>
                      <MobileCardField label="Closing Date">
                        {formatDate(tender.submissionDate)}
                      </MobileCardField>
                      <MobileCardField label="Time Left" className="col-span-2">
                        {tender.status === 'evaluation' ? (
                          (() => {
                            const submissionDate = tender.updatedAt;
                            return `Submitted ${formatDate(submissionDate)}`;
                          })()
                        ) : daysLeft === null ? (
                          '-'
                        ) : daysLeft < 0 ? (
                          <span className="text-red-500 font-semibold">
                            {Math.abs(daysLeft)} days overdue
                          </span>
                        ) : daysLeft === 0 ? (
                          <span className="text-orange-500 font-semibold">
                            Due today
                          </span>
                        ) : (
                          <span className={daysLeft <= 3 ? 'text-orange-500 font-semibold' : 'text-foreground'}>
                            {daysLeft} days left
                          </span>
                        )}
                      </MobileCardField>
                    </MobileCardGrid>
                  </MobileCardBody>
                </MobileCard>
              );
            })}
          </MobileCardList>

            {/* Pagination */}
            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              className="mt-6"
            />
          </>
        )}
    </div>
  );
}
