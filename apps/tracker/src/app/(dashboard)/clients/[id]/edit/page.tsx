import { getCurrentUser } from '@/server';
import { getClientById } from '@/server';
import { ClientForm } from '@/components/clients/client-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
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
            Please select an organization to edit clients.
          </p>
        </div>
      </div>
    );
  }

  const result = await getClientById(session.activeOrganizationId, id);

  if (!result.success || !result.client) {
    notFound();
  }

  return (
    <ClientForm
      organizationId={session.activeOrganizationId}
      client={result.client}
      mode="edit"
    />
  );
}
