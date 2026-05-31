import { getCurrentUser } from '@/server';
import { getProjectById } from '@/server/projects';
import { ProjectForm } from '@/components/projects/project-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { session } = await getCurrentUser();
  const { id } = await params;

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to edit projects.
          </p>
        </div>
      </div>
    );
  }

  const result = await getProjectById(session.activeOrganizationId, id);

  if (!result.success || !result.project) {
    notFound();
  }

  return (
    <ProjectForm
      organizationId={session.activeOrganizationId}
      project={result.project}
      mode="edit"
    />
  );
}