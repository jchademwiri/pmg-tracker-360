import { getCurrentUser } from '@/server';
import { ClientForm } from '@/components/clients/client-form';

export const dynamic = 'force-dynamic';

export default async function NewClientPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to create clients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClientForm organizationId={session.activeOrganizationId} mode="create" />
  );
}
