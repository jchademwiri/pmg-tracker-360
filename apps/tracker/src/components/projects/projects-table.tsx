'use client';

import Link from 'next/link';
import { Badge } from '@pmg/ui/components/ui/badge';
import { Button } from '@pmg/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@pmg/ui/components/ui/table';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

interface Project {
  id: string;
  projectNumber: string;
  description: string | null;
  status: string;
  createdAt: Date;
  client: { id: string; name: string } | null;
  tender: { id: string; tenderNumber: string } | null;
}

interface ProjectsTableProps {
  projects: Project[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function ProjectsTable({ projects, totalCount, currentPage, totalPages }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No projects found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/projects/create">Create your first project</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Tender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.projectNumber}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">{project.description ?? '—'}</TableCell>
                <TableCell>{project.client?.name ?? '—'}</TableCell>
                <TableCell>{project.tender?.tenderNumber ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[project.status] ?? 'secondary'} className="capitalize">
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} total</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      )}
    </div>
  );
}
