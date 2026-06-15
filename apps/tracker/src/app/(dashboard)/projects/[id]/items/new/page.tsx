import { getCurrentUser } from '@/server';
import { getProjectById } from '@/server/projects';
import { ProjectLineItemForm } from '@/components/projects/project-line-item-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface NewProjectItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewProjectItemPage({ params }: NewProjectItemPageProps) {
  const { id } = await params;
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to add project items.</p>
        </div>
      </div>
    );
  }

  const projectResult = await getProjectById(session.activeOrganizationId, id);

  if (!projectResult.success || !projectResult.project) {
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
      mode="create"
    />
  );
}
