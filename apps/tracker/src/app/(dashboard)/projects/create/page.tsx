import { getCurrentUser } from '@/server';
import { ProjectForm } from '@/components/projects/project-form';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to create projects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProjectForm organizationId={session.activeOrganizationId} mode="create" />
  );
}