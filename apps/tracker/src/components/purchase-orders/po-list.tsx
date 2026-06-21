'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  MoreHorizontalIcon,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListPagination } from '@/components/shared/pagination';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from '@/components/ui/mobile-card';
import {
  MobileFilterDrawer,
  MobileFilterField,
} from '@/components/ui/mobile-filter-drawer';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getPurchaseOrders,
  deletePurchaseOrder,
} from '@/server/purchase-orders';
import { formatCurrency, formatDate } from '@/lib/format';
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
  projects?: { id: string; projectNumber: string }[];
  suppliers?: string[];
}

export function POList({
  organizationId,
  initialPOs = [],
  initialTotalCount = 0,
  projectId,
  projects = [],
  suppliers = [],
}: POListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Local state for search query (so users can type without immediately reloading)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [deletePOId, setDeletePOId] = useState<string | null>(null);

  // Sync search query if URL changes externally
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Read current filters directly from URL search params
  const statusFilter = searchParams.get('status') || 'all';
  const supplierFilter = searchParams.get('supplier') || 'all';
  const projectFilter = searchParams.get('projectId') || 'all';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const pos = initialPOs;
  const totalCount = initialTotalCount;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const isLoading = isPending;

  // Draft states for mobile filter drawer
  const [draftStatus, setDraftStatus] = useState(statusFilter);
  const [draftSupplier, setDraftSupplier] = useState(supplierFilter);
  const [draftProject, setDraftProject] = useState(projectFilter);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);

  // Sync draft states when filters change
  useEffect(() => {
    setDraftStatus(statusFilter);
    setDraftSupplier(supplierFilter);
    setDraftProject(projectFilter);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
  }, [statusFilter, supplierFilter, projectFilter, startDate, endDate]);

  // Shared function to update search params and trigger router transition
  const applyFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset to page 1 on filter change
    if (!updates.page) {
      params.delete('page');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, router, pathname]);

  // Debounce the search input updates to URL
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (searchQuery !== currentSearch) {
        applyFilters({ search: searchQuery });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchParams, applyFilters]);

  const handleStatusFilter = (status: string) => {
    applyFilters({ status });
  };

  const handleSupplierFilter = (supplier: string) => {
    applyFilters({ supplier });
  };

  const handleProjectFilter = (projId: string) => {
    applyFilters({ projectId: projId });
  };

  const handleStartDateChange = (date: string) => {
    applyFilters({ startDate: date });
  };

  const handleEndDateChange = (date: string) => {
    applyFilters({ endDate: date });
  };

  const handlePageChange = (page: number) => {
    applyFilters({ page: page.toString() });
  };

  const handleApplyMobileFilters = () => {
    applyFilters({
      status: draftStatus,
      supplier: draftSupplier,
      projectId: draftProject,
      startDate: draftStartDate,
      endDate: draftEndDate,
    });
  };

  const handleClearMobileFilters = () => {
    setDraftStatus('all');
    setDraftSupplier('all');
    setDraftProject('all');
    setDraftStartDate('');
    setDraftEndDate('');
    applyFilters({
      status: null,
      supplier: null,
      projectId: null,
      startDate: null,
      endDate: null,
    });
  };

  const confirmDeletePO = async () => {
    if (!deletePOId) return;
    startTransition(async () => {
      const result = await deletePurchaseOrder(organizationId, deletePOId);
      if (result.success) {
        router.refresh();
        toast.success('Purchase order deleted');
      } else {
        toast.error(result.error || 'Failed to delete purchase order');
      }
      setDeletePOId(null);
    });
  };

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Purchase Orders</CardTitle>
        </div>

        {/* Desktop Search and Filters */}
        <div className="hidden md:flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by PO number, supplier, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {!projectId && (
              <Select value={projectFilter} onValueChange={handleProjectFilter}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={handleSupplierFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Date From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-[150px] h-9"
              />
              <span>To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-[150px] h-9"
              />
            </div>

            {(searchQuery || statusFilter !== 'all' || supplierFilter !== 'all' || projectFilter !== 'all' || startDate || endDate) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  handleClearMobileFilters();
                }}
                className="ml-auto"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search + Filter Drawer */}
        <div className="md:hidden space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search POs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <MobileFilterDrawer
            activeFilterCount={
              (statusFilter !== 'all' ? 1 : 0) +
              (supplierFilter !== 'all' ? 1 : 0) +
              (projectFilter !== 'all' ? 1 : 0) +
              (startDate ? 1 : 0) +
              (endDate ? 1 : 0)
            }
            onApply={handleApplyMobileFilters}
            onClear={handleClearMobileFilters}
            title="Filter Purchase Orders"
          >
            {!projectId && (
              <MobileFilterField label="Project">
                <Select value={draftProject} onValueChange={setDraftProject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.projectNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MobileFilterField>
            )}

            <MobileFilterField label="Status">
              <Select value={draftStatus} onValueChange={setDraftStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterField>

            <MobileFilterField label="Supplier">
              <Select value={draftSupplier} onValueChange={setDraftSupplier}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterField>

            <MobileFilterField label="Date From">
              <Input
                type="date"
                value={draftStartDate}
                onChange={(e) => setDraftStartDate(e.target.value)}
                className="w-full"
              />
            </MobileFilterField>

            <MobileFilterField label="Date To">
              <Input
                type="date"
                value={draftEndDate}
                onChange={(e) => setDraftEndDate(e.target.value)}
                className="w-full"
              />
            </MobileFilterField>
          </MobileFilterDrawer>
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
                <Link href="/projects/purchase-orders/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Purchase Order
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map((po) => (
                    <TableRow
                      key={po.id}
                      className="cursor-pointer group rounded-md hover:bg-accent transition-colors duration-200"
                      onClick={() =>
                        router.push(
                          `/projects/purchase-orders/${po.id}`
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
                        <StatusBadge status={po.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatCurrency(po.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(po.expectedDeliveryDate)}
                        </span>
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
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/purchase-orders/${po.id}`);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/purchase-orders/${po.id}/edit`);
                              }}
                            >
                              Edit PO
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletePOId(po.id);
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
            <MobileCardList>
              {pos.map((po) => {
                const actions = [
                  { label: 'View Details', onClick: () => router.push(`/projects/purchase-orders/${po.id}`) },
                  { label: 'Edit PO', onClick: () => router.push(`/projects/purchase-orders/${po.id}/edit`) },
                  { label: 'Delete PO', onClick: () => setDeletePOId(po.id), variant: 'destructive' as const },
                ];

                return (
                  <MobileCard
                    key={po.id}
                    onClick={() => router.push(`/projects/purchase-orders/${po.id}`)}
                  >
                    <MobileCardHeader
                      identifier={po.poNumber}
                      status={po.status}
                      actions={actions}
                    />
                    <MobileCardBody>
                      {po.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {po.description}
                        </p>
                      )}
                      <MobileCardGrid>
                        <MobileCardField label="Supplier">
                          {po.supplierName || 'Not specified'}
                        </MobileCardField>
                        <MobileCardField label="Project">
                          {po.project?.projectNumber.toUpperCase() || 'Unknown'}
                        </MobileCardField>
                        <MobileCardField label="Total Amount">
                          {formatCurrency(po.totalAmount)}
                        </MobileCardField>
                        <MobileCardField label="PO Date">
                          {formatDate(po.poDate)}
                        </MobileCardField>
                        <MobileCardField label="Expected Delivery">
                          {formatDate(po.expectedDeliveryDate)}
                        </MobileCardField>
                        <MobileCardField label="Created">
                          {formatDate(po.createdAt)}
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
              onPageChange={handlePageChange}
              isLoading={isLoading}
              className="mt-6"
            />
          </>
        )}
      </CardContent>
      <AlertDialog
        open={!!deletePOId}
        onOpenChange={(open) => !open && setDeletePOId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the purchase order and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePO}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
