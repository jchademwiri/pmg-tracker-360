'use client';

import { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  MoreHorizontalIcon,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { DataTableShell } from '@/components/shared/tables/data-table-shell';
import { DataTableToolbar } from '@/components/shared/data-table-toolbar';

import { getProjects, deleteProject } from '@/server/projects';
import { formatDate, formatClientName } from '@/lib/format';

interface ProjectWithRelations {
  id: string;
  projectNumber: string;
  description: string | null;
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
  tender: {
    id: string;
    tenderNumber: string;
    description: string | null;
  } | null;
  completionPercentage?: number;
}

interface ProjectListProps {
  organizationId: string;
  initialProjects?: ProjectWithRelations[];
  initialTotalCount?: number;
  clients?: { id: string; name: string }[];
}

const PROJECT_TABS = [
  { id: 'all', label: 'All Projects' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function ProjectList({
  organizationId,
  initialProjects = [],
  initialTotalCount = 0,
  clients: initialClients = [],
}: ProjectListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [projects, setProjects] = useState<ProjectWithRelations[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch projects with search, pagination, and client filter
  const fetchProjects = useCallback(
    async (search?: string, page: number = 1, status?: string, clientId?: string) => {
      setIsLoading(true);
      try {
        const result = await getProjects(organizationId, search, page, itemsPerPage, status, clientId);
        setProjects(result.projects);
        setTotalCount(result.totalCount);
        setCurrentPage(result.currentPage);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  // Reset and refetch data when organizationId changes
  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setClientFilter('all');
    setCurrentPage(1);
    if (organizationId) {
      fetchProjects('', 1);
    }
  }, [organizationId, fetchProjects]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchProjects(query, 1, statusFilter, clientFilter);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchProjects(searchQuery, 1, status, clientFilter);
  };

  // Handle client filter
  const handleClientFilter = (clientId: string) => {
    setClientFilter(clientId);
    setCurrentPage(1);
    fetchProjects(searchQuery, 1, statusFilter, clientId);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProjects(searchQuery, page, statusFilter, clientFilter);
  };

  // Handle delete project
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;

    startTransition(async () => {
      const result = await deleteProject(organizationId, deleteProjectId);
      if (result.success) {
        fetchProjects(searchQuery, currentPage, statusFilter, clientFilter);
        toast.success('Project deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
      setDeleteProjectId(null);
    });
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];
    if (statusFilter !== 'all') {
      const tab = PROJECT_TABS.find(t => t.id === statusFilter);
      chips.push({
        key: 'status',
        label: 'Status',
        value: tab?.label || statusFilter,
        onRemove: () => handleStatusFilter('all'),
      });
    }
    if (clientFilter !== 'all') {
      const client = initialClients.find(c => c.id === clientFilter);
      chips.push({
        key: 'client',
        label: 'Client',
        value: client ? formatClientName(client.name) : clientFilter,
        onRemove: () => handleClientFilter('all'),
      });
    }
    if (searchQuery) {
      chips.push({
        key: 'search',
        label: 'Search',
        value: `"${searchQuery}"`,
        onRemove: () => {
          setSearchQuery('');
          fetchProjects('', 1, statusFilter, clientFilter);
        },
      });
    }
    return chips;
  }, [statusFilter, clientFilter, searchQuery, initialClients, fetchProjects]);

  const clientOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Clients' },
      ...initialClients.map((c) => ({
        value: c.id,
        label: formatClientName(c.name),
      })),
    ];
  }, [initialClients]);

  return (
    <div className="space-y-4">
      {/* Universal Compact DataTableToolbar */}
      <DataTableToolbar
        tabs={PROJECT_TABS}
        activeTab={statusFilter}
        onTabChange={handleStatusFilter}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search projects by number or description..."
        facetedFilters={[
          {
            id: 'client',
            placeholder: 'All Clients',
            icon: Building2,
            options: clientOptions,
            value: clientFilter,
            onChange: handleClientFilter,
            width: 'w-[190px]',
          },
        ]}
        activeFilters={activeFilterChips}
        onClearAllFilters={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setClientFilter('all');
          fetchProjects('', 1, 'all', 'all');
        }}
        mobileDrawerTitle="Filter Projects"
      />

      <DataTableShell
        entityLabel="projects"
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        dataLength={projects.length}
        isLoading={isLoading}
        emptyState={{
          type: searchQuery || statusFilter !== 'all' || clientFilter !== 'all' ? 'no-results' : 'empty',
          icon: 'file',
          title: searchQuery || statusFilter !== 'all' || clientFilter !== 'all' ? 'No projects found' : 'No projects yet',
          description: searchQuery || statusFilter !== 'all' || clientFilter !== 'all'
            ? 'No projects match your filter criteria.'
            : 'Get started by creating your first project.',
          actionLabel: searchQuery || statusFilter !== 'all' || clientFilter !== 'all' ? undefined : 'Add Project',
          actionHref: searchQuery || statusFilter !== 'all' || clientFilter !== 'all' ? undefined : '/projects/create',
        }}
        mobileContent={
          <MobileCardList>
            {projects.map((project) => {
              const actions = [
                { label: 'View Details' as const, onClick: () => router.push(`/projects/${project.id}`) },
                { label: 'Edit Project' as const, onClick: () => router.push(`/projects/${project.id}/edit`) },
                { label: 'Delete Project' as const, onClick: () => setDeleteProjectId(project.id), variant: 'destructive' as const },
              ];

              return (
                <MobileCard key={project.id} onClick={() => router.push(`/projects/${project.id}`)}>
                  <MobileCardHeader
                    identifier={project.projectNumber.toUpperCase()}
                    badge={<StatusBadge status={project.status} domain="project" />}
                    actions={actions}
                  />
                  <MobileCardBody>
                    <h3 className="font-semibold text-foreground text-sm">
                      {formatClientName(project.client?.name) || 'No Client'}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Delivery Progress</span>
                        <span className="font-semibold text-foreground">{project.completionPercentage || 0}%</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" style={{ width: `${project.completionPercentage || 0}%` }} />
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                    <MobileCardGrid>
                      <MobileCardField label="Tender">{project.tender?.tenderNumber.toUpperCase() || 'None'}</MobileCardField>
                      <MobileCardField label="Created">{formatDate(project.createdAt)}</MobileCardField>
                    </MobileCardGrid>
                  </MobileCardBody>
                </MobileCard>
              );
            })}
          </MobileCardList>
        }
      >
        {/* Desktop Table */}
        <Table className="w-full table-fixed">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="w-[42%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Project & Client</TableHead>
              <TableHead className="w-[16%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="w-[20%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Delivery Progress</TableHead>
              <TableHead className="w-[15%] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tender</TableHead>
              <TableHead className="w-[7%] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer group border-b border-border/40 hover:bg-accent/40 transition-colors duration-150"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                      <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="font-semibold text-foreground text-sm font-mono text-sky-500 dark:text-sky-400 truncate">
                        {project.projectNumber.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatClientName(project.client?.name) || 'No Client'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} domain="project" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 min-w-[120px]">
                    <div className="relative w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                        style={{ width: `${project.completionPercentage || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{project.completionPercentage || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    {project.tender ? (
                      <Link
                        href={`/tenders/${project.tender.id}`}
                        className="text-blue-600 dark:text-blue-400 font-mono hover:underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.tender.tenderNumber.toUpperCase()}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
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
                      <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>Edit Project</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteProjectId(project.id)}
                        variant="destructive"
                        disabled={isPending}
                      >
                        Delete Project
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
      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
