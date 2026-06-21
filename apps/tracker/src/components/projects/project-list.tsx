'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  MobileFilterDrawer,
  MobileFilterField,
} from '@/components/ui/mobile-filter-drawer';
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

import { getProjects, deleteProject } from '@/server/projects';
import { formatDate } from '@/lib/format';

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
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ProjectList({
  organizationId,
  initialProjects = [],
  initialTotalCount = 0,
}: ProjectListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [projects, setProjects] =
    useState<ProjectWithRelations[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch projects with search and pagination
  const fetchProjects = useCallback(
    async (search?: string, page: number = 1, status?: string) => {
      setIsLoading(true);
      try {
        const result = await getProjects(
          organizationId,
          search,
          page,
          itemsPerPage,
          status
        );
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
    // Reset search and filters
    setSearchQuery('');
    setStatusFilter('all');
    setDraftStatusFilter('all');
    setCurrentPage(1);

    // Fetch fresh data for the new organization
    if (organizationId) {
      fetchProjects('', 1);
    }
  }, [organizationId, fetchProjects]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchProjects(query, 1, statusFilter);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setDraftStatusFilter(status);
    setCurrentPage(1);
    fetchProjects(searchQuery, 1, status);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProjects(searchQuery, page, statusFilter);
  };

  // Handle delete project
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;

    startTransition(async () => {
      const result = await deleteProject(organizationId, deleteProjectId);
      if (result.success) {
        fetchProjects(searchQuery, currentPage, statusFilter);
        toast.success('Project deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
      setDeleteProjectId(null);
    });
  };

  // Format date for display — uses shared formatDate from @/lib/format
  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projects</CardTitle>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by project number or description..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="hidden sm:block">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:hidden">
            <MobileFilterDrawer
              activeFilterCount={statusFilter !== 'all' ? 1 : 0}
              onApply={() => handleStatusFilter(draftStatusFilter)}
              onClear={() => handleStatusFilter('all')}
              title="Filter Projects"
            >
              <MobileFilterField label="Status">
                <Select
                  value={draftStatusFilter}
                  onValueChange={setDraftStatusFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MobileFilterField>
            </MobileFilterDrawer>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No projects found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No projects match your search criteria.'
                : 'Get started by creating your first project.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                onClick={() => router.push('/projects/create')}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
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
                    <TableHead>Project Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Delivery Progress</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tender</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer group rounded-md hover:bg-accent transition-colors duration-200"
                      onClick={() =>
                        router.push(`/projects/${project.id}`)
                      }
                    >
                      <TableCell>
                        <div className="font-medium text-blue-600">
                          {project.projectNumber.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {project.client?.name || 'No Client'}
                          </div>
                          {project.client?.contactName && (
                            <div className="text-sm text-muted-foreground">
                              {project.client.contactName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 min-w-[120px]">
                          <div className="relative w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" 
                              style={{ width: `${project.completionPercentage || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-zinc-300">
                            {project.completionPercentage || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {project.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={project.status} domain="project" />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {project.tender ? (
                            <span className="text-blue-600">
                              {project.tender.tenderNumber.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(project.createdAt)}
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
                                router.push(`/projects/${project.id}`);
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${project.id}/edit`);
                              }}
                            >
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteProjectId(project.id);
                              }}
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
            </div>

            {/* Mobile Cards */}
            <MobileCardList>
              {projects.map((project) => {
                const actions = [
                  { label: 'View Details', onClick: () => router.push(`/projects/${project.id}`) },
                  { label: 'Edit Project', onClick: () => router.push(`/projects/${project.id}/edit`) },
                  { label: 'Delete Project', onClick: () => setDeleteProjectId(project.id), variant: 'destructive' as const },
                ];

                return (
                  <MobileCard
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <MobileCardHeader
                      identifier={project.projectNumber.toUpperCase()}
                      badge={
                        <StatusBadge status={project.status} domain="project" />
                      }
                      actions={actions}
                    />
                    <MobileCardBody>
                      <h3 className="font-semibold text-foreground text-sm">
                        {project.client?.name || 'No Client'}
                      </h3>

                      {/* Delivery Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Delivery Progress</span>
                          <span className="font-semibold text-foreground">{project.completionPercentage || 0}%</span>
                        </div>
                        <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" 
                            style={{ width: `${project.completionPercentage || 0}%` }}
                          />
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <MobileCardGrid>
                        <MobileCardField label="Tender">
                          {project.tender?.tenderNumber.toUpperCase() || 'None'}
                        </MobileCardField>
                        <MobileCardField label="Created">
                          {formatDate(project.createdAt)}
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
            <AlertDialogAction
              onClick={confirmDeleteProject}
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
