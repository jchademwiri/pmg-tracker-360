'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  MoreHorizontalIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DataTableShell } from '@/components/shared/tables/data-table-shell';

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
  projectId?: string;
  projects?: { id: string; projectNumber: string }[];
  suppliers?: string[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_delivered', label: 'Partially Delivered' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' },
];

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

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [deletePOId, setDeletePOId] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

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

  const [draftStatus, setDraftStatus] = useState(statusFilter);
  const [draftSupplier, setDraftSupplier] = useState(supplierFilter);
  const [draftProject, setDraftProject] = useState(projectFilter);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);

  useEffect(() => {
    setDraftStatus(statusFilter);
    setDraftSupplier(supplierFilter);
    setDraftProject(projectFilter);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
  }, [statusFilter, supplierFilter, projectFilter, startDate, endDate]);

  const applyFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!updates.page) {
      params.delete('page');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (searchQuery !== currentSearch) {
        applyFilters({ search: searchQuery });
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchParams, applyFilters]);

  const handleStatusFilter = (status: string) => applyFilters({ status });
  const handleSupplierFilter = (supplier: string) => applyFilters({ supplier });
  const handleProjectFilter = (projId: string) => applyFilters({ projectId: projId });
  const handleStartDateChange = (date: string) => applyFilters({ startDate: date });
  const handleEndDateChange = (date: string) => applyFilters({ endDate: date });
  const handlePageChange = (page: number) => applyFilters({ page: page.toString() });

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
    applyFilters({ status: null, supplier: null, projectId: null, startDate: null, endDate: null });
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

  const hasActiveFilters = statusFilter !== 'all' || supplierFilter !== 'all' || projectFilter !== 'all' || !!startDate || !!endDate;

  const activeFilterChips = [
    ...(statusFilter !== 'all' ? [{ key: 'status', label: 'Status', value: STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || statusFilter }] : []),
    ...(supplierFilter !== 'all' ? [{ key: 'supplier', label: 'Supplier', value: supplierFilter }] : []),
    ...(projectFilter !== 'all' && !projectId ? [{ key: 'projectId', label: 'Project', value: projects.find(p => p.id === projectFilter)?.projectNumber || projectFilter }] : []),
    ...(searchQuery ? [{ key: 'search', label: 'Search', value: searchQuery }] : []),
  ];

  return (
    <>
      <DataTableShell
        title="Purchase Orders"
        entityLabel="purchase orders"
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        dataLength={pos.length}
        searchPlaceholder="Search by PO number, supplier, or description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        activeFilters={hasActiveFilters ? activeFilterChips : undefined}
        onRemoveFilter={(key) => {
          if (key === 'status') applyFilters({ status: null });
          if (key === 'supplier') applyFilters({ supplier: null });
          if (key === 'projectId') applyFilters({ projectId: null });
          if (key === 'search') { setSearchQuery(''); applyFilters({ search: null }); }
        }}
        onClearFilters={() => { setSearchQuery(''); handleClearMobileFilters(); }}
        emptyState={{
          type: searchQuery || hasActiveFilters ? 'no-results' : 'empty',
          icon: 'file',
          title: searchQuery || hasActiveFilters ? 'No purchase orders found' : 'No purchase orders yet',
          description: searchQuery || hasActiveFilters
            ? 'No purchase orders match your search criteria.'
            : 'Get started by creating your first purchase order.',
          actionLabel: searchQuery || hasActiveFilters ? undefined : 'Add Purchase Order',
          actionHref: searchQuery || hasActiveFilters ? undefined : '/projects/purchase-orders/create',
        }}
        actionLabel={pos.length > 0 ? 'Add Purchase Order' : undefined}
        actionHref="/projects/purchase-orders/create"
        desktopFilterBar={
          <div className="flex flex-wrap items-center gap-2">
            {!projectId && (
              <Select value={projectFilter} onValueChange={handleProjectFilter}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.projectNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={handleSupplierFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Date:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-[140px] h-9"
              />
              <span>to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>
          </div>
        }
        mobileFilterBar={
          <MobileFilterDrawer
            activeFilterCount={hasActiveFilters ? Object.entries({ statusFilter, supplierFilter, projectFilter, startDate, endDate }).filter(([k, v]) => v !== 'all' && v !== '').length : 0}
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
                      <SelectItem key={p.id} value={p.id}>{p.projectNumber}</SelectItem>
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
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
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
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterField>
            <MobileFilterField label="Date From">
              <Input type="date" value={draftStartDate} onChange={(e) => setDraftStartDate(e.target.value)} className="w-full" />
            </MobileFilterField>
            <MobileFilterField label="Date To">
              <Input type="date" value={draftEndDate} onChange={(e) => setDraftEndDate(e.target.value)} className="w-full" />
            </MobileFilterField>
          </MobileFilterDrawer>
        }
      >
        {/* Desktop Table */}
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
                onClick={() => router.push(`/projects/purchase-orders/${po.id}`)}
              >
                <TableCell><div className="font-medium text-blue-600">{po.poNumber}</div></TableCell>
                <TableCell><div className="font-medium">{po.supplierName || 'Not specified'}</div></TableCell>
                <TableCell>
                  <div className="font-medium text-green-600">
                    {po.project?.projectNumber.toUpperCase() || 'Unknown Project'}
                  </div>
                </TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{formatDate(po.poDate)}</span></TableCell>
                <TableCell><StatusBadge status={po.status} /></TableCell>
                <TableCell><span className="text-sm">{formatCurrency(po.totalAmount)}</span></TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{formatDate(po.expectedDeliveryDate)}</span></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 cursor-pointer">
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/projects/purchase-orders/${po.id}`)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/projects/purchase-orders/${po.id}/edit`)}>Edit PO</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeletePOId(po.id)} disabled={isPending}>
                        Delete PO
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        mobileContent={
          <MobileCardList>
            {pos.map((po) => {
              const actions = [
                { label: 'View Details' as const, onClick: () => router.push(`/projects/purchase-orders/${po.id}`) },
                { label: 'Edit PO' as const, onClick: () => router.push(`/projects/purchase-orders/${po.id}/edit`) },
                { label: 'Delete PO' as const, onClick: () => setDeletePOId(po.id), variant: 'destructive' as const },
              ];

              return (
                <MobileCard key={po.id} onClick={() => router.push(`/projects/purchase-orders/${po.id}`)}>
                  <MobileCardHeader identifier={po.poNumber} status={po.status} actions={actions} />
                  <MobileCardBody>
                    {po.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{po.description}</p>
                    )}
                    <MobileCardGrid>
                      <MobileCardField label="Supplier">{po.supplierName || 'Not specified'}</MobileCardField>
                      <MobileCardField label="Project">{po.project?.projectNumber.toUpperCase() || 'Unknown'}</MobileCardField>
                      <MobileCardField label="Total Amount">{formatCurrency(po.totalAmount)}</MobileCardField>
                      <MobileCardField label="PO Date">{formatDate(po.poDate)}</MobileCardField>
                      <MobileCardField label="Expected Delivery">{formatDate(po.expectedDeliveryDate)}</MobileCardField>
                      <MobileCardField label="Created">{formatDate(po.createdAt)}</MobileCardField>
                    </MobileCardGrid>
                  </MobileCardBody>
                </MobileCard>
              );
            })}
          </MobileCardList>
        }
      </DataTableShell>

      <AlertDialog open={!!deletePOId} onOpenChange={(open) => !open && setDeletePOId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the purchase order and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePO} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
