'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  Calendar,
  Banknote,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getTenders, deleteTender } from '@/server/tenders';
import { formatDate } from '@/lib/format';
import Link from 'next/link';

interface TenderWithClient {
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
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } | null;
}

interface TenderListProps {
  organizationId: string;
  initialTenders?: TenderWithClient[];
  initialTotalCount?: number;
  defaultStatusFilter?: string;
  showStatusToggle?: boolean;
  pageType?: 'active' | 'submitted';
}

const statusColors = {
  open: 'bg-green-100/10 text-green-400 border border-green-500/20',
  closed: 'bg-zinc-800 text-zinc-400 border border-zinc-700/30',
  evaluation: 'bg-blue-100/10 text-blue-400 border border-blue-500/20',
  awarded: 'bg-amber-100/10 text-amber-400 border border-amber-500/20',
  lost: 'bg-red-100/10 text-red-400 border border-red-500/20',
  cancelled: 'bg-zinc-100/10 text-zinc-400 border border-zinc-500/20',
};

const statusLabels = {
  open: 'Open',
  closed: 'Closed',
  evaluation: 'Evaluation',
  awarded: 'Appointed / Awarded',
  lost: 'Rejected / Lost',
  cancelled: 'Cancelled',
};

export function TenderList({
  organizationId,
  initialTenders = [],
  initialTotalCount = 0,
  defaultStatusFilter = 'all',
  showStatusToggle = false,
  pageType = 'active',
}: TenderListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tenders, setTenders] = useState<TenderWithClient[]>(initialTenders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(initialTotalCount); // Used for client-side pagination
  const [showAllStatuses, setShowAllStatuses] = useState(
    defaultStatusFilter === 'all'
  );

  // Filter tenders based on status filter for submitted-pending option
  const filteredTenders =
    statusFilter === 'submitted-pending'
      ? tenders.filter(
          (t) => t.status === 'evaluation' || t.status === 'closed'
        )
      : tenders;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch tenders with search, status filter, and pagination
  const fetchTenders = useCallback(
    async (search?: string, page: number = 1, status?: string) => {
      setIsLoading(true);
      try {
        const result = await getTenders(
          organizationId,
          search,
          page,
          itemsPerPage,
          status
        );
        setTenders(result.tenders);
        setTotalCount(result.totalCount);
        setCurrentPage(result.currentPage);
      } catch (error) {
        console.error('Error fetching tenders:', error);
        toast.error('Failed to load tenders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  // Reset and refetch data when organizationId changes
  useEffect(() => {
    // Reset search and filters
    setSearchQuery('');
    setStatusFilter(defaultStatusFilter);
    setShowAllStatuses(defaultStatusFilter === 'all');
    setCurrentPage(1);

    const serverStatus =
      defaultStatusFilter === 'all'
          ? undefined
          : defaultStatusFilter;

    if (organizationId) {
      fetchTenders('', 1, serverStatus);
    }
  }, [organizationId, fetchTenders, defaultStatusFilter]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchTenders(query, 1);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);

    fetchTenders(searchQuery, 1, status === 'all' ? undefined : status);
  };

  // Handle status toggle for active tenders page
  const handleStatusToggle = () => {
    const newShowAll = !showAllStatuses;
    setShowAllStatuses(newShowAll);
    setStatusFilter(newShowAll ? 'all' : 'open');
    setCurrentPage(1);
    fetchTenders(searchQuery, 1, newShowAll ? undefined : 'open');
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTenders(searchQuery, page, statusFilter);
  };

  // Handle delete tender
  const handleDeleteTender = async (tenderId: string) => {
    if (!confirm('Are you sure you want to delete this tender?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteTender(organizationId, tenderId);
      if (result.success) {
        toast.success('Tender deleted successfully');
        fetchTenders(searchQuery, currentPage, statusFilter);
      } else {
        toast.error(result.error || 'Failed to delete tender');
      }
    });
  };

  // Format date for display — uses shared formatDate from @/lib/format
  // Format currency value
  const formatValue = (value: string | null) => {
    if (!value) return 'Not set';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(numValue);
  };

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tenders</CardTitle>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by tender number or description..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Toggle for Active Tenders */}
          {showStatusToggle && pageType === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusToggle}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showAllStatuses ? 'Show Open Only' : 'Show All Tenders'}
            </Button>
          )}

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {pageType === 'submitted' ? (
                // Submitted page: show evaluation & closed by default, but allow all
                <>
                  <SelectItem value="submitted-pending">Default</SelectItem>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="awarded">Appointed / Awarded</SelectItem>
                  <SelectItem value="lost">Rejected / Lost</SelectItem>
                </>
              ) : (
                // Active tenders page: all statuses
                <>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                  <SelectItem value="awarded">Appointed / Awarded</SelectItem>
                  <SelectItem value="lost">Rejected / Lost</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading tenders...
            </div>
          </div>
        ) : filteredTenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No tenders found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No tenders match your search criteria.'
                : 'Get started by creating your first tender.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button asChild size={'lg'}>
                <Link href="/tenders/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tender
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg overflow-hidden border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Closing Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenders.map((tender) => (
                    <TableRow
                      key={tender.id}
                      className="cursor-pointer group rounded-md hover:bg-accent transition-colors duration-200"
                      onClick={() =>
                        router.push(`/tenders/${tender.id}`)
                      }
                    >
                      <TableCell>
                        <div className="font-medium text-blue-600">
                          {tender.tenderNumber.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tender.client?.name || 'Unknown Client'}
                          </div>
                          {tender.client?.contactName && (
                            <div className="text-sm text-muted-foreground">
                              {tender.client.contactName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {tender.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[
                              tender.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {
                            statusLabels[
                              tender.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatValue(tender.value)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(tender.submissionDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/tenders/${tender.id}`);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/tenders/${tender.id}/edit`
                                );
                              }}
                            >
                              Edit Tender
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTender(tender.id);
                              }}
                              className="text-red-600"
                              disabled={isPending}
                            >
                              Delete Tender
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredTenders.map((tender) => (
                <Card
                  key={tender.id}
                  className="cursor-pointer hover:bg-accent transition-colors duration-200 group rounded-lg border hover:ring-1 hover:ring-ring"
                  onClick={() => router.push(`/tenders/${tender.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                            {tender.tenderNumber.toUpperCase()}
                          </h3>
                          <Badge
                            className={
                              statusColors[
                                tender.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {
                              statusLabels[
                                tender.status as keyof typeof statusLabels
                              ]
                            }
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-900 mb-1">
                          <strong>Client:</strong>{' '}
                          {tender.client?.name || 'Unknown Client'}
                        </div>

                        {tender.description && (
                          <p className="text-sm text-foreground/80 mb-2 line-clamp-2">
                            {tender.description}
                          </p>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Banknote className="h-3 w-3 mr-1" />
                            {formatValue(tender.value)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Submission: {formatDate(tender.submissionDate)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">
                            Created {formatDate(tender.createdAt)}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tenders/${tender.id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/tenders/${tender.id}/edit`
                              );
                            }}
                          >
                            Edit Tender
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTender(tender.id);
                            }}
                            className="text-red-600"
                            disabled={isPending}
                          >
                            Delete Tender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of{' '}
                  {totalCount} tenders
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                  >
                    Next
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
