import { getProjectById } from '@/server/projects';
import { ProjectForm } from '@/components/projects/project-form';
import { notFound, redirect } from 'next/navigation';
import { checkUserSession } from '@/lib/session-check';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Project' };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');
  const { id } = await params;
  const organizationId = session.activeOrganizationId ?? 'stub-org-id';

  const result = await getProjectById(organizationId, id);

  if (!result.success || !result.project) {
    notFound();
  }

  return (
    <ProjectForm
      organizationId={organizationId}
      project={result.project as any}
      mode="edit"
    />
  );
}
