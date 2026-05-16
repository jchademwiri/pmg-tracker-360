'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';

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

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'won':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'lost':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}


function formatDate(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleDateString();
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tenders</span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalCount > 0
              ? `${startItem}-${endItem} of ${totalCount}`
              : 'No tenders'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tenders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tenders found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
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
                      {/* <TableHead className="min-w-[100px] hidden md:table-cell">
                        Value
                      </TableHead> */}
                      <TableHead className="min-w-[120px] hidden lg:table-cell">
                        Submission Date
                      </TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">
                        Days Left
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
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
                            {tender.tenderNumber}
                          </TableCell>
                          <TableCell>
                            {tender.client?.name || 'Unknown Client'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate hidden sm:table-cell">
                            {tender.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(tender.status)}>
                              {tender.status}
                            </Badge>
                          </TableCell>
                          {/* <TableCell className="hidden md:table-cell">
                            {formatCurrency(tender.value)}
                          </TableCell> */}
                          <TableCell className="hidden lg:table-cell">
                            {formatDate(tender.submissionDate)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {tender.status === 'submitted' ? (
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
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="cursor-pointer"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {onViewTender && (
                                  <DropdownMenuItem
                                    onClick={() => onViewTender(tender.id)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                )}
                                {onEditTender && (
                                  <DropdownMenuItem
                                    onClick={() => onEditTender(tender.id)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {onDeleteTender && (
                                  <DropdownMenuItem
                                    onClick={() => onDeleteTender(tender.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
