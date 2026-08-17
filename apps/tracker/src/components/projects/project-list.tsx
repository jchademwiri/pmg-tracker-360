"use client";

import {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontalIcon,
  Building2,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  MobileCard,
  MobileCardHeader,
  MobileCardBody,
  MobileCardField,
  MobileCardGrid,
  MobileCardList,
} from "@/components/ui/mobile-card";
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

import { getProjects, deleteProject } from "@/server/projects";
import { formatDate, formatClientName, toTitleCase } from "@/lib/format";

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
  initialClients?: { id: string; name: string }[];
  clients?: { id: string; name: string }[];
}

const PROJECT_TABS = [
  { id: "all", label: "All Projects" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function ProjectDescriptionCell({
  description,
}: {
  description: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (!description) {
    return (
      <span className="italic text-muted-foreground/50 normal-case text-xs">
        No description provided
      </span>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(description);
    setCopied(true);
    toast.success("Description copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex items-start gap-1.5 pr-2">
      <p
        className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-words flex-1"
        title={description}
      >
        {toTitleCase(description)}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-accent/60 opacity-80 group-hover:opacity-100 focus:opacity-100 transition-all shrink-0 cursor-pointer"
        title="Copy full description"
        aria-label="Copy description"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export function ProjectList({
  organizationId,
  initialProjects = [],
  initialTotalCount = 0,
  initialClients: initialClientsProp,
  clients: clientsProp,
}: ProjectListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialClients = initialClientsProp || clientsProp || [];

  const [projects, setProjects] =
    useState<ProjectWithRelations[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const fetchProjects = useCallback(
    async (
      search?: string,
      page: number = 1,
      status?: string,
      clientId?: string,
    ) => {
      setIsLoading(true);
      try {
        const result = await getProjects(
          organizationId,
          search,
          page,
          itemsPerPage,
          status === "all" ? undefined : status,
          clientId === "all" ? undefined : clientId,
        );
        setProjects(result.projects as ProjectWithRelations[]);
        setTotalCount(result.totalCount);
        setCurrentPage(result.currentPage);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId],
  );

  useEffect(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setClientFilter("all");
    setCurrentPage(1);
    if (organizationId) {
      fetchProjects("", 1, "all", "all");
    }
  }, [organizationId, fetchProjects]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    fetchProjects(value, 1, statusFilter, clientFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchProjects(searchQuery, 1, status, clientFilter);
  };

  const handleClientFilter = (clientId: string) => {
    setClientFilter(clientId);
    setCurrentPage(1);
    fetchProjects(searchQuery, 1, statusFilter, clientId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProjects(searchQuery, page, statusFilter, clientFilter);
  };

  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;

    startTransition(async () => {
      const result = await deleteProject(organizationId, deleteProjectId);
      if (result.success) {
        fetchProjects(searchQuery, currentPage, statusFilter, clientFilter);
        toast.success("Project deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete project");
      }
      setDeleteProjectId(null);
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
      const tab = PROJECT_TABS.find((t) => t.id === statusFilter);
      chips.push({
        key: "status",
        label: "Status",
        value: tab?.label || statusFilter,
        onRemove: () => handleStatusFilter("all"),
      });
    }
    if (clientFilter !== "all") {
      const client = initialClients.find((c) => c.id === clientFilter);
      chips.push({
        key: "client",
        label: "Client",
        value: client ? formatClientName(client.name) : clientFilter,
        onRemove: () => handleClientFilter("all"),
      });
    }
    if (searchQuery) {
      chips.push({
        key: "search",
        label: "Search",
        value: `"${searchQuery}"`,
        onRemove: () => {
          setSearchQuery("");
          fetchProjects("", 1, statusFilter, clientFilter);
        },
      });
    }
    return chips;
  }, [statusFilter, clientFilter, searchQuery, initialClients, fetchProjects]);

  const clientOptions = useMemo(() => {
    return [
      { value: "all", label: "All Clients" },
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
            id: "client",
            placeholder: "All Clients",
            icon: Building2,
            options: clientOptions,
            value: clientFilter,
            onChange: handleClientFilter,
            width: "w-[190px]",
          },
        ]}
        activeFilters={activeFilterChips}
        onClearAllFilters={() => {
          setSearchQuery("");
          setStatusFilter("all");
          setClientFilter("all");
          fetchProjects("", 1, "all", "all");
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
          type:
            searchQuery || statusFilter !== "all" || clientFilter !== "all"
              ? "no-results"
              : "empty",
          icon: "file",
          title:
            searchQuery || statusFilter !== "all" || clientFilter !== "all"
              ? "No projects found"
              : "No projects yet",
          description:
            searchQuery || statusFilter !== "all" || clientFilter !== "all"
              ? "No projects match your filter criteria."
              : "Get started by creating your first project.",
          actionLabel:
            searchQuery || statusFilter !== "all" || clientFilter !== "all"
              ? undefined
              : "Add Project",
          actionHref:
            searchQuery || statusFilter !== "all" || clientFilter !== "all"
              ? undefined
              : "/projects/create",
        }}
        mobileContent={
          <MobileCardList>
            {projects.map((project) => {
              const actions = [
                {
                  label: "View Details" as const,
                  onClick: () => router.push(`/projects/${project.id}`),
                },
                {
                  label: "Edit Project" as const,
                  onClick: () => router.push(`/projects/${project.id}/edit`),
                },
                {
                  label: "Delete Project" as const,
                  onClick: () => setDeleteProjectId(project.id),
                  variant: "destructive" as const,
                },
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
                    <h3 className="font-semibold text-foreground text-sm tracking-wide">
                      {formatClientName(project.client?.name) || "No Client"}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Delivery Progress</span>
                        <span className="font-semibold font-mono tabular-nums text-foreground">
                          {project.completionPercentage || 0}%
                        </span>
                      </div>
                      <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${project.completionPercentage || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1">
                        {toTitleCase(project.description)}
                      </p>
                    )}
                    <MobileCardGrid>
                      <MobileCardField label="Tender">
                        {project.tender?.tenderNumber.toUpperCase() || "None"}
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
        }
      >
        {/* Desktop Table with 5 balanced columns */}
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[22%]">Project & Client</TableHead>
              <TableHead className="w-[32%]">Description</TableHead>
              <TableHead className="w-[14%]">Status</TableHead>
              <TableHead className="w-[17%]">Delivery Progress</TableHead>
              <TableHead className="w-[15%]">Linked Tender</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {/* 1. Project & Client */}
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-accent/60 border border-border/60 text-foreground flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="font-bold text-foreground text-xs truncate tracking-tight">
                        {formatClientName(project.client?.name) || "No Client"}
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xs font-mono font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors truncate w-fit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.projectNumber.toUpperCase()}
                      </Link>
                    </div>
                  </div>
                </TableCell>

                {/* 2. Description */}
                <TableCell>
                  <ProjectDescriptionCell description={project.description} />
                </TableCell>

                {/* 3. Status */}
                <TableCell>
                  <StatusBadge status={project.status} domain="project" />
                </TableCell>

                {/* 4. Delivery Progress */}
                <TableCell>
                  <div className="flex items-center space-x-2.5 min-w-[120px]">
                    <div className="relative w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5 shrink-0">
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${project.completionPercentage || 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold tabular-nums text-foreground">
                      {project.completionPercentage || 0}%
                    </span>
                  </div>
                </TableCell>

                {/* 5. Linked Tender */}
                <TableCell>
                  <div className="text-xs">
                    {project.tender ? (
                      <Link
                        href={`/tenders/${project.tender.id}`}
                        className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 hover:underline font-mono font-bold transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{project.tender.tenderNumber.toUpperCase()}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProjectId}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
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
