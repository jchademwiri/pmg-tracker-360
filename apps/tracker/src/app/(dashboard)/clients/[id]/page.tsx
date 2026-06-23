import { getCurrentUser } from '@/server';
import { getClientById, getClientRelatedRecords } from '@/server';
import { ClientDetails } from '@/components/clients/client-details';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
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
            Please select an organization to view clients.
          </p>
        </div>
      </div>
    );
  }

  const result = await getClientById(session.activeOrganizationId, id);

  if (!result.success || !result.client) {
    notFound();
  }

  // Fetch related records (tenders, projects, POs)
  const relatedRecordsResult = await getClientRelatedRecords(
    session.activeOrganizationId,
    id
  );

  return (
    <ClientDetails
      client={result.client}
      organizationId={session.activeOrganizationId}
      relatedTenders={relatedRecordsResult.records.tenders}
      relatedProjects={relatedRecordsResult.records.projects}
      purchaseOrderCount={relatedRecordsResult.records.purchaseOrderCount}
    />
  );
}
