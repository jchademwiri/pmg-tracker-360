"use client";

import {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  MoreHorizontalIcon,
  Building2,
  Package,
  Calendar,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from "@/components/ui/mobile-card";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableShell } from "@/components/shared/tables/data-table-shell";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";

import { deletePurchaseOrder } from "@/server/purchase-orders";
import {
  formatCurrency,
  formatDate,
  formatClientName,
  toTitleCase,
} from "@/lib/format";
import Link from "next/link";

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

const PO_STATUS_TABS = [
  { id: "all", label: "All POs" },
  { id: "open", label: "Open" },
  { id: "sent", label: "Sent" },
  { id: "partially_delivered", label: "Partial Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
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

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [deletePOId, setDeletePOId] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const statusFilter = searchParams.get("status") || "all";
  const supplierFilter = searchParams.get("supplier") || "all";
  const projectFilter = searchParams.get("projectId") || "all";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const pos = initialPOs;
  const totalCount = initialTotalCount;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const isLoading = isPending;

  const applyFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      if (!("page" in updates)) {
        params.set("page", "1");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, router, pathname],
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters({ search: query || null });
  };

  const handleStatusFilter = (status: string) => {
    applyFilters({ status: status === "all" ? null : status });
  };

  const handleSupplierFilter = (supplier: string) => {
    applyFilters({ supplier: supplier === "all" ? null : supplier });
  };

  const handleProjectFilter = (projId: string) => {
    applyFilters({ projectId: projId === "all" ? null : projId });
  };

  const handlePageChange = (page: number) => {
    applyFilters({ page: page.toString() });
  };

  const confirmDeletePO = async () => {
    if (!deletePOId) return;

    startTransition(async () => {
      const result = await deletePurchaseOrder(organizationId, deletePOId);
      if (result.success) {
        toast.success("Purchase order deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete purchase order");
      }
      setDeletePOId(null);
    });
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];
    if (statusFilter !== "all") {
      const tab = PO_STATUS_TABS.find((t) => t.id === statusFilter);
      chips.push({
        key: "status",
        label: "Status",
        value: tab?.label || statusFilter,
        onRemove: () => handleStatusFilter("all"),
      });
    }
    if (supplierFilter !== "all") {
      chips.push({
        key: "supplier",
        label: "Supplier",
        value: formatClientName(supplierFilter),
        onRemove: () => handleSupplierFilter("all"),
      });
    }
    if (projectFilter !== "all") {
      const project = projects.find((p) => p.id === projectFilter);
      chips.push({
        key: "project",
        label: "Project",
        value: project ? project.projectNumber.toUpperCase() : projectFilter,
        onRemove: () => handleProjectFilter("all"),
      });
    }
    if (startDate || endDate) {
      chips.push({
        key: "date",
        label: "Date Range",
        value: `${startDate || "Start"} to ${endDate || "Now"}`,
        onRemove: () => applyFilters({ startDate: null, endDate: null }),
      });
    }
    if (searchQuery) {
      chips.push({
        key: "search",
        label: "Search",
        value: `"${searchQuery}"`,
        onRemove: () => handleSearch(""),
      });
    }
    return chips;
  }, [
    statusFilter,
    supplierFilter,
    projectFilter,
    startDate,
    endDate,
    searchQuery,
    projects,
    applyFilters,
  ]);

  const facetedFilters = useMemo(() => {
    const filtersList = [];
    if (!projectId && projects.length > 0) {
      filtersList.push({
        id: "project",
        placeholder: "All Projects",
        options: [
          { value: "all", label: "All Projects" },
          ...projects.map((p) => ({
            value: p.id,
            label: p.projectNumber.toUpperCase(),
          })),
        ],
        value: projectFilter,
        onChange: handleProjectFilter,
        width: "w-[190px]",
      });
    }
    if (suppliers.length > 0) {
      filtersList.push({
        id: "supplier",
        placeholder: "All Suppliers",
        icon: Building2,
        options: [
          { value: "all", label: "All Suppliers" },
          ...suppliers.map((s) => ({
            value: s,
            label: formatClientName(s),
          })),
        ],
        value: supplierFilter,
        onChange: handleSupplierFilter,
        width: "w-[190px]",
      });
    }
    return filtersList;
  }, [projectId, projects, projectFilter, suppliers, supplierFilter]);

  const hasActiveFilters = activeFilterChips.length > 0;

  return (
    <div className="space-y-4">
      {/* Universal Compact DataTableToolbar */}
      <DataTableToolbar
        tabs={PO_STATUS_TABS}
        activeTab={statusFilter}
        onTabChange={handleStatusFilter}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by PO number, supplier, or description..."
        facetedFilters={facetedFilters}
        activeFilters={activeFilterChips}
        onClearAllFilters={() => {
          applyFilters({
            search: null,
            status: null,
            supplier: null,
            projectId: null,
            startDate: null,
            endDate: null,
          });
        }}
        mobileDrawerTitle="Filter Purchase Orders"
      />

      <DataTableShell
        entityLabel="purchase orders"
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        dataLength={pos.length}
        isLoading={isLoading}
        emptyState={{
          type: searchQuery || hasActiveFilters ? "no-results" : "empty",
          icon: "package",
          title:
            searchQuery || hasActiveFilters
              ? "No purchase orders found"
              : "No purchase orders yet",
          description:
            searchQuery || hasActiveFilters
              ? "No purchase orders match your filter criteria."
              : "Get started by creating your first purchase order.",
          actionLabel:
            searchQuery || hasActiveFilters ? undefined : "Add Purchase Order",
          actionHref:
            searchQuery || hasActiveFilters
              ? undefined
              : "/projects/purchase-orders/create",
        }}
        mobileContent={
          <MobileCardList>
            {pos.map((po) => {
              const actions = [
                {
                  label: "View Details" as const,
                  onClick: () =>
                    router.push(`/projects/purchase-orders/${po.id}`),
                },
                {
                  label: "Edit PO" as const,
                  onClick: () =>
                    router.push(`/projects/purchase-orders/${po.id}/edit`),
                },
                {
                  label: "Delete PO" as const,
                  onClick: () => setDeletePOId(po.id),
                  variant: "destructive" as const,
                },
              ];

              return (
                <MobileCard
                  key={po.id}
                  onClick={() =>
                    router.push(`/projects/purchase-orders/${po.id}`)
                  }
                >
                  <MobileCardHeader
                    identifier={po.poNumber.toUpperCase()}
                    badge={
                      <StatusBadge status={po.status} domain="purchaseOrder" />
                    }
                    actions={actions}
                  />
                  <MobileCardBody>
                    <h3 className="font-semibold text-foreground text-sm tracking-wide">
                      {formatClientName(po.supplierName) || "No Supplier"}
                    </h3>
                    <div className="text-sm font-mono font-bold tabular-nums text-foreground">
                      {formatCurrency(po.totalAmount)}
                    </div>
                    {po.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1">
                        {toTitleCase(po.description)}
                      </p>
                    )}
                    <MobileCardGrid>
                      <MobileCardField label="Project">
                        {po.project?.projectNumber.toUpperCase() || "None"}
                      </MobileCardField>
                      <MobileCardField label="PO Date">
                        {po.poDate ? formatDate(po.poDate) : "Not set"}
                      </MobileCardField>
                    </MobileCardGrid>
                  </MobileCardBody>
                </MobileCard>
              );
            })}
          </MobileCardList>
        }
      >
        {/* Desktop Table with 6 balanced columns */}
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">PO & Supplier</TableHead>
              <TableHead className="w-[18%]">Project</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[17%]">Total Amount</TableHead>
              <TableHead className="w-[16%]">PO Date</TableHead>
              <TableHead className="w-[7%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pos.map((po) => (
              <TableRow
                key={po.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/projects/purchase-orders/${po.id}`)
                }
              >
                {/* 1. PO & Supplier */}
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="font-bold text-foreground text-xs truncate tracking-tight">
                        {formatClientName(po.supplierName) || "No Supplier"}
                      </div>
                      <div className="font-mono font-bold text-xs text-sky-400 truncate">
                        {po.poNumber.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* 2. Project Link */}
                <TableCell>
                  <div className="text-xs">
                    {po.project ? (
                      <Link
                        href={`/projects/${po.project.id}`}
                        className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 hover:underline font-mono font-bold transition-colors truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {po.project.projectNumber.toUpperCase()}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </TableCell>

                {/* 3. Status */}
                <TableCell>
                  <StatusBadge status={po.status} domain="purchaseOrder" />
                </TableCell>

                {/* 4. Total Amount */}
                <TableCell>
                  <span className="text-xs font-mono font-bold tabular-nums text-foreground">
                    {formatCurrency(po.totalAmount)}
                  </span>
                </TableCell>

                {/* 5. PO Date */}
                <TableCell>
                  {po.poDate ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{formatDate(po.poDate)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* 6. Actions */}
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
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
                        onClick={() =>
                          router.push(`/projects/purchase-orders/${po.id}`)
                        }
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/projects/purchase-orders/${po.id}/edit`)
                        }
                      >
                        Edit PO
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletePOId(po.id)}
                        variant="destructive"
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
      </DataTableShell>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletePOId}
        onOpenChange={(open) => !open && setDeletePOId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase order? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePO}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
