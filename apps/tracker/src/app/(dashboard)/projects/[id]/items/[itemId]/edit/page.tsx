import { getCurrentUser } from '@/server';
import { getProjectById } from '@/server/projects';
import { getProjectLineItemById } from '@/server/purchase-orders';
import { ProjectLineItemForm } from '@/components/projects/project-line-item-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditProjectItemPageProps {
  params: Promise<{ id: string; itemId: string }>;
}

export default async function EditProjectItemPage({ params }: EditProjectItemPageProps) {
  const { id, itemId } = await params;
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to edit project items.</p>
        </div>
      </div>
    );
  }

  const [projectResult, itemResult] = await Promise.all([
    getProjectById(session.activeOrganizationId, id),
    getProjectLineItemById(session.activeOrganizationId, id, itemId),
  ]);

  if (!projectResult.success || !projectResult.project || !itemResult.success || !itemResult.lineItem) {
    notFound();
  }

  return (
    <ProjectLineItemForm
      organizationId={session.activeOrganizationId}
      project={{
        id: projectResult.project.id,
        projectNumber: projectResult.project.projectNumber,
        description: projectResult.project.description,
      }}
      mode="edit"
      lineItem={itemResult.lineItem as any}
    />
  );
}
