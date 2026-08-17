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
  Phone,
  Mail,
  Calendar,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from "@/components/ui/mobile-card";
import { DataTableShell } from "@/components/shared/tables/data-table-shell";
import { DataTableToolbar } from "@/components/shared/data-table-toolbar";

import { getClients, deleteClient } from "@/server";
import {
  formatDate,
  formatClientName,
  toTitleCase,
  formatPhoneNumber,
} from "@/lib/format";
import type { Client } from "@pmg/db/schema";
import Link from "next/link";

interface ClientListProps {
  organizationId: string;
  initialClients?: Client[];
  initialTotalCount?: number;
}

function ClientContactCell({ client }: { client: Client }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const displayPhone = client.contactPhone
    ? formatPhoneNumber(client.contactPhone)
    : null;
  const displayEmail = client.contactEmail
    ? client.contactEmail.trim().toLowerCase()
    : null;
  const displayName = client.contactName
    ? toTitleCase(client.contactName)
    : null;

  const handleCopy = (
    e: React.MouseEvent,
    text: string,
    type: "phone" | "email",
  ) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    toast.success(`Copied ${type}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!displayPhone && !displayEmail && !displayName) {
    return (
      <span className="text-xs text-muted-foreground/60 italic">
        No contact logged
      </span>
    );
  }

  return (
    <div
      className="flex flex-col gap-1 text-xs text-left"
      onClick={(e) => e.stopPropagation()}
    >
      {displayName && (
        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
          <span className="truncate">{displayName}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {displayPhone && (
          <div className="inline-flex items-center gap-1">
            <a
              href={`tel:${displayPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-emerald-400 font-medium transition-colors"
              title={`Call ${displayPhone}`}
            >
              <Phone
                className="h-3 w-3 text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span>{displayPhone}</span>
            </a>
            <button
              type="button"
              onClick={(e) => handleCopy(e, displayPhone, "phone")}
              className="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors cursor-pointer"
              title="Copy Phone Number"
            >
              {copiedField === "phone" ? (
                <Check className="h-2.5 w-2.5 text-emerald-400" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        )}

        {displayEmail && (
          <div className="inline-flex items-center gap-1">
            <a
              href={`mailto:${displayEmail}`}
              className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-sky-400 font-medium transition-colors truncate max-w-[190px]"
              title={`Email ${displayEmail}`}
            >
              <Mail
                className="h-3 w-3 text-sky-400 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{displayEmail}</span>
            </a>
            <button
              type="button"
              onClick={(e) => handleCopy(e, displayEmail, "email")}
              className="p-0.5 text-muted-foreground/60 hover:text-foreground rounded transition-colors cursor-pointer"
              title="Copy Email Address"
            >
              {copiedField === "email" ? (
                <Check className="h-2.5 w-2.5 text-sky-400" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientList({
  organizationId,
  initialClients = [],
  initialTotalCount = 0,
}: ClientListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const fetchClientsData = useCallback(
    async (search?: string, page: number = 1) => {
      setIsLoading(true);
      try {
        const result = await getClients(
          organizationId,
          search,
          page,
          itemsPerPage,
        );
        setClients(result.clients);
        setTotalCount(result.totalCount);
        setCurrentPage(result.currentPage);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId],
  );

  useEffect(() => {
    setSearchQuery("");
    setCurrentPage(1);
    if (organizationId) {
      fetchClientsData("", 1);
    }
  }, [organizationId, fetchClientsData]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    fetchClientsData(value, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchClientsData(searchQuery, page);
  };

  const confirmDeleteClient = async () => {
    if (!deleteClientId) return;

    startTransition(async () => {
      const result = await deleteClient(organizationId, deleteClientId);
      if (result.success) {
        toast.success("Client deleted successfully");
        fetchClientsData(searchQuery, currentPage);
      } else {
        toast.error(result.error || "Failed to delete client");
      }
      setDeleteClientId(null);
    });
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];
    if (searchQuery) {
      chips.push({
        key: "search",
        label: "Search",
        value: `"${searchQuery}"`,
        onRemove: () => {
          setSearchQuery("");
          fetchClientsData("", 1);
        },
      });
    }
    return chips;
  }, [searchQuery, fetchClientsData]);

  return (
    <div className="space-y-4">
      {/* Universal Compact DataTableToolbar */}
      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search clients by name, contact, or email..."
        activeFilters={activeFilterChips}
        onClearAllFilters={() => {
          setSearchQuery("");
          fetchClientsData("", 1);
        }}
        mobileDrawerTitle="Filter Clients"
      />

      <DataTableShell
        entityLabel="clients"
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        dataLength={clients.length}
        isLoading={isLoading}
        emptyState={{
          type: searchQuery ? "no-results" : "empty",
          icon: "user",
          title: searchQuery ? "No clients found" : "No clients yet",
          description: searchQuery
            ? "No clients match your search criteria."
            : "Get started by adding your first client.",
          actionLabel: searchQuery ? undefined : "Add Client",
          actionHref: searchQuery ? undefined : "/clients/create",
        }}
        mobileContent={
          <MobileCardList>
            {clients.map((client) => {
              const actions = [
                {
                  label: "View Details" as const,
                  onClick: () => router.push(`/clients/${client.id}`),
                },
                {
                  label: "Edit Client" as const,
                  onClick: () => router.push(`/clients/${client.id}/edit`),
                },
                {
                  label: "Delete Client" as const,
                  onClick: () => setDeleteClientId(client.id),
                  variant: "destructive" as const,
                },
              ];

              return (
                <MobileCard
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <MobileCardHeader
                    identifier={formatClientName(client.name)}
                    actions={actions}
                  />
                  <MobileCardBody>
                    <ClientContactCell client={client} />
                    <MobileCardGrid>
                      <MobileCardField label="Created">
                        {formatDate(client.createdAt)}
                      </MobileCardField>
                    </MobileCardGrid>
                  </MobileCardBody>
                </MobileCard>
              );
            })}
          </MobileCardList>
        }
      >
        {/* Desktop table with 4 balanced columns */}
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[36%]">Client Name</TableHead>
              <TableHead className="w-[38%]">Primary Contact</TableHead>
              <TableHead className="w-[18%]">Created Date</TableHead>
              <TableHead className="w-[8%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                {/* 1. Client Name */}
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-bold text-foreground text-xs hover:text-sky-400 transition-colors truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formatClientName(client.name)}
                    </Link>
                  </div>
                </TableCell>

                {/* 2. Primary Contact */}
                <TableCell>
                  <ClientContactCell client={client} />
                </TableCell>

                {/* 3. Created Date */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{formatDate(client.createdAt)}</span>
                  </div>
                </TableCell>

                {/* 4. Actions */}
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
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/clients/${client.id}/edit`)
                        }
                      >
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteClientId(client.id)}
                        variant="destructive"
                        disabled={isPending}
                      >
                        Delete Client
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
        open={!!deleteClientId}
        onOpenChange={(open) => !open && setDeleteClientId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
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
