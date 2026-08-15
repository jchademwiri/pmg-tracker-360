'use client';

import { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontalIcon, Mail, Phone, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from '@/components/ui/mobile-card';
import { DataTableShell } from '@/components/shared/tables/data-table-shell';
import { DataTableToolbar } from '@/components/shared/data-table-toolbar';

import { getClients, deleteClient } from '@/server';
import { formatDate, formatClientName } from '@/lib/format';
import type { Client } from '@pmg/db/schema';
import Link from 'next/link';

interface ClientListProps {
  organizationId: string;
  initialClients?: Client[];
  initialTotalCount?: number;
}

export function ClientList({
  organizationId,
  initialClients = [],
  initialTotalCount = 0,
}: ClientListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch clients with search and pagination
  const fetchClients = useCallback(
    async (search?: string, page: number = 1) => {
      setIsLoading(true);
      try {
        const result = await getClients(
          organizationId,
          search,
          page,
          itemsPerPage
        );
        setClients(result.clients);
        setTotalCount(result.totalCount);
        setCurrentPage(result.currentPage);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  // Reset and refetch data when organizationId changes
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
    if (organizationId) {
      fetchClients('', 1);
    }
  }, [organizationId, fetchClients]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    fetchClients(value, 1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchClients(searchQuery, page);
  };

  // Handle delete client
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  const confirmDeleteClient = async () => {
    if (!deleteClientId) return;

    startTransition(async () => {
      const result = await deleteClient(organizationId, deleteClientId);
      if (result.success) {
        fetchClients(searchQuery, currentPage);
        toast.success('Client deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete client');
      }
      setDeleteClientId(null);
    });
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];
    if (searchQuery) {
      chips.push({
        key: 'search',
        label: 'Search',
        value: `"${searchQuery}"`,
        onRemove: () => handleSearch(''),
      });
    }
    return chips;
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Universal Compact DataTableToolbar */}
      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search clients by company name, contact, or email..."
        activeFilters={activeFilterChips}
        onClearAllFilters={() => handleSearch('')}
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
          type: searchQuery ? 'no-results' : 'empty',
          icon: 'user',
          title: searchQuery ? 'No clients found' : 'No clients yet',
          description: searchQuery
            ? 'No clients match your search criteria.'
            : 'Get started by adding your first client.',
          actionLabel: searchQuery ? undefined : 'Add Client',
          actionHref: searchQuery ? undefined : '/clients/create',
        }}
        mobileContent={
          <MobileCardList>
            {clients.map((client) => {
              const actions = [
                { label: 'View Details' as const, onClick: () => router.push(`/clients/${client.id}`) },
                { label: 'Edit Client' as const, onClick: () => router.push(`/clients/${client.id}/edit`) },
                { label: 'Delete Client' as const, onClick: () => setDeleteClientId(client.id), variant: 'destructive' as const },
              ];

              return (
                <MobileCard key={client.id} onClick={() => router.push(`/clients/${client.id}`)}>
                  <MobileCardHeader
                    identifier={formatClientName(client.name)}
                    actions={actions}
                  />
                  <MobileCardBody>
                    {client.contactName && (
                      <div className="text-sm font-medium text-foreground">
                        {client.contactName}
                      </div>
                    )}
                    {(client.contactEmail || client.contactPhone) && (
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {client.contactEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{client.contactEmail}</span>
                          </div>
                        )}
                        {client.contactPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{client.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <MobileCardGrid>
                      <MobileCardField label="Created">{formatDate(client.createdAt)}</MobileCardField>
                    </MobileCardGrid>
                  </MobileCardBody>
                </MobileCard>
              );
            })}
          </MobileCardList>
        }
      >
        {/* Desktop table */}
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="w-[45%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Client Name</TableHead>
              <TableHead className="w-[32%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Primary Contact</TableHead>
              <TableHead className="w-[16%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
              <TableHead className="w-[7%] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer group border-b border-border/40 hover:bg-accent/40 transition-colors duration-150"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                      <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <div className="font-semibold text-foreground text-sm truncate">
                      {formatClientName(client.name)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-xs">
                    {client.contactName ? (
                      <div className="font-medium text-foreground">{client.contactName}</div>
                    ) : (
                      <span className="text-muted-foreground">No contact name</span>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {client.contactEmail && <span>{client.contactEmail}</span>}
                      {client.contactPhone && <span>{client.contactPhone}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</span>
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
                      <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}/edit`)}>
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
      <AlertDialog open={!!deleteClientId} onOpenChange={(open) => !open && setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone and may affect associated tenders and projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
