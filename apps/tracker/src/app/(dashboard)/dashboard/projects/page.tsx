import { getCurrentUser } from '@/server';
import { getProjects } from '@/server/projects';
import { ProjectList } from '@/components/projects/project-list';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const { session } = await getCurrentUser();
  const { auth } = await import('@/lib/auth');
  const { headers } = await import('next/headers');
  const headersList = await headers();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view projects.
          </p>
        </div>
      </div>
    );
  }

  // Fetch initial projects
  const result = await getProjects(session.activeOrganizationId, '', 1, 10);

  const initialProjects = result.projects;
  const initialTotalCount = result.totalCount;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track all your construction projects.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            await auth.api.hasPermission({
              headers: headersList,
              body: {
                permissions: {
                  project: ['create'],
                },
              },
            })
          ).success && (
            <Button asChild size={'lg'}>
              <Link href="/dashboard/projects/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Link>
            </Button>
          )}

          {(
            await auth.api.hasPermission({
              headers: headersList,
              body: {
                permissions: {
                  purchase_order: ['create'],
                },
              },
            })
          ).success && (
            <Button asChild size={'lg'}>
              <Link href="/dashboard/projects/purchase-orders/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Purchase Order
              </Link>
            </Button>
          )}
        </div>
      </header>

      <ProjectList
        organizationId={session.activeOrganizationId}
        initialProjects={initialProjects}
        initialTotalCount={initialTotalCount}
      />
    </div>
  );
}
