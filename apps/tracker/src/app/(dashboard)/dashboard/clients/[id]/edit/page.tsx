import { getCurrentUser } from '@/server';
import { getClientById } from '@/server';
import { ClientForm } from '@/components/clients/client-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Client' };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session } = await getCurrentUser();
  const { id } = await params;
  const organizationId = session.activeOrganizationId ?? 'stub-org-id';

  const result = await getClientById(organizationId, id);

  if (!result.success || !result.client) {
    notFound();
  }

  return (
    <ClientForm
      organizationId={organizationId}
      client={result.client}
      mode="edit"
    />
  );
}
