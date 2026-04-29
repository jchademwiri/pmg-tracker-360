import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { getProjects } from '@/server/projects';
import { ProjectsTable } from '@/components/projects/projects-table';
import { Button } from '@pmg/ui/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Projects' };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');

  const params = await searchParams;
  const organizationId = session.activeOrganizationId!;
  const page = parseInt(params.page ?? '1');

  const result = await getProjects(organizationId, params.search, page, 10, params.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Track projects linked to your won tenders.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/create">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>
      <ProjectsTable
        projects={result.projects}
        totalCount={result.totalCount}
        currentPage={result.currentPage}
        totalPages={result.totalPages}
      />
    </div>
  );
}
