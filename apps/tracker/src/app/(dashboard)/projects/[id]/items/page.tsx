import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/server';
import { getProjectById } from '@/server/projects';
import { getProjectLineItems } from '@/server/purchase-orders';
import { ProjectLineItemsList } from '@/components/projects/project-line-items-list';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProjectItemsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectItemsPage({ params }: ProjectItemsPageProps) {
  const { id } = await params;
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to view project items.</p>
        </div>
      </div>
    );
  }

  const projectResult = await getProjectById(session.activeOrganizationId, id);

  if (!projectResult.success || !projectResult.project) {
    notFound();
  }

  const itemsResult = await getProjectLineItems(session.activeOrganizationId, id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/projects/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
      </Button>

      <ProjectLineItemsList
        organizationId={session.activeOrganizationId}
        project={{
          id: projectResult.project.id,
          projectNumber: projectResult.project.projectNumber,
          description: projectResult.project.description,
        }}
        lineItems={(itemsResult.lineItems || []) as any}
      />
    </div>
  );
}
