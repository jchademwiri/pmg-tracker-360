'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Button } from '@pmg/ui/components/ui/button';
import { Input } from '@pmg/ui/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@pmg/ui/components/ui/card';
import { Badge } from '@pmg/ui/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@pmg/ui/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@pmg/ui/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pmg/ui/components/ui/select';

import {
  getPurchaseOrders,
  deletePurchaseOrder,
} from '@/server/purchase-orders';
import Link from 'next/link';

interface PurchaseOrderWithProject {
  id: string;
  poNumber: string;
  supplierName: string | null;
  description: string;
  totalAmount: string;
  status: string;
  poDate: Date | null;
  expectedDeliveryDate: Date | null;
  deliveredAt: Date | null;
  deliveryAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    projectNumber: string;
    description: string | null;
  } | null;
}

interface POListProps {
  organizationId: string;
  initialPOs?: PurchaseOrderWithProject[];
  initialTotalCount?: number;
  projectId?: string; // Optional: filter by specific project
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
};

const statusLabels = {
  draft: 'Draft',
  sent: 'Sent',
  delivered: 'Delivered',
};

export function POList({
  organizationId,
  initialPOs = [],
  initialTotalCount = 0,
  projectId,
}: POListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pos, setPos] = useState<PurchaseOrderWithProject[]>(initialPOs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch POs with search and pagination
  const fetchPOs = useCallback(
    async (search?: string, page: number = 1, status?: string) => {
      setIsLoading(true);
      try {
        const result = await getPurchaseOrders(
          organizationId,
          search,
          page,
          itemsPerPage,
          projectId,
          status === 'all' ? undefined : status
        );
        setPos(result.purchaseOrders);
        setTotalCount(result.totalCount);
        setCurrentPage(result.currentPage);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        toast.error('Failed to load purchase orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, projectId]
  );

  // Reset and refetch data when organizationId or projectId changes
  useEffect(() => {
    // Reset search and filters
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);

    // Fetch fresh data
    if (organizationId) {
      fetchPOs('', 1);
    }
  }, [organizationId, projectId, fetchPOs]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchPOs(query, 1, statusFilter);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchPOs(searchQuery, 1, status);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPOs(searchQuery, page, statusFilter);
  };

  // Handle delete PO
  const handleDeletePO = async (poId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }

    startTransition(async () => {
      const result = await deletePurchaseOrder(organizationId, poId);
      if (result.success) {
        // Refresh the current page
        fetchPOs(searchQuery, currentPage, statusFilter);
      } else {
        alert(result.error || 'Failed to delete purchase order');
      }
    });
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

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
          <CardTitle>Purchase Orders</CardTitle>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by PO number, supplier, or description..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading purchase orders...
            </div>
          </div>
        ) : pos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No purchase orders found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No purchase orders match your search criteria.'
                : 'Get started by creating your first purchase order.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button asChild size={'lg'}>
                <Link href="/dashboard/purchase-orders/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Purchase Order
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
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map((po) => (
                    <TableRow
                      key={po.id}
                      className="cursor-pointer group rounded-md hover:bg-accent transition-colors duration-200"
                      onClick={() =>
                        router.push(
                          `/dashboard/purchase-orders/${po.id}`
                        )
                      }
                    >
                      <TableCell>
                        <div className="font-medium text-blue-600">
                          {po.poNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {po.supplierName || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {po.project?.projectNumber.toUpperCase() ||
                            'Unknown Project'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(po.poDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[po.status as keyof typeof statusColors]
                          }
                        >
                          {statusLabels[po.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatValue(po.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(po.expectedDeliveryDate)}
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
                                router.push(
                                  `/dashboard/purchase-orders/${po.id}`
                                );
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/purchase-orders/${po.id}/edit`
                                );
                              }}
                            >
                              Edit PO
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePO(po.id);
                              }}
                              className="text-red-600"
                              disabled={isPending}
                            >
                              Delete PO
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
              {pos.map((po) => (
                <Card
                  key={po.id}
                  className="cursor-pointer hover:bg-accent transition-colors duration-200 group rounded-lg border hover:ring-1 hover:ring-ring"
                  onClick={() =>
                    router.push(`/dashboard/purchase-orders/${po.id}`)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                            {po.poNumber}
                          </h3>
                          <Badge
                            className={
                              statusColors[
                                po.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {
                              statusLabels[
                                po.status as keyof typeof statusLabels
                              ]
                            }
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-900 mb-1">
                          <strong>Supplier:</strong>{' '}
                          {po.supplierName || 'Not specified'}
                        </div>

                        <div className="text-sm text-gray-900 mb-1">
                          <strong>Project:</strong>{' '}
                          {po.project?.projectNumber.toUpperCase() || 'Unknown'}
                        </div>

                        <div className="text-sm text-gray-900 mb-1">
                          <strong>PO Date:</strong> {formatDate(po.poDate)}
                        </div>

                        {po.description && (
                          <p className="text-sm text-foreground/80 mb-2 line-clamp-2">
                            {po.description}
                          </p>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatValue(po.totalAmount)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expected: {formatDate(po.expectedDeliveryDate)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">
                            Created {formatDate(po.createdAt)}
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
                              router.push(
                                `/dashboard/purchase-orders/${po.id}`
                              );
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/purchase-orders/${po.id}/edit`
                              );
                            }}
                          >
                            Edit PO
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePO(po.id);
                            }}
                            className="text-red-600"
                            disabled={isPending}
                          >
                            Delete PO
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
                  {totalCount} purchase orders
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
                    disabled={currentPage === totalPages || isLoading}
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
