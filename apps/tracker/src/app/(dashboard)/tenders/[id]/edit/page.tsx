import { getCurrentUser } from '@/server';
import { getTenderById } from '@/server/tenders';
import { TenderForm } from '@/components/tenders/tender-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface EditTenderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTenderPage({ params }: EditTenderPageProps) {
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
            Please select an organization to edit tenders.
          </p>
        </div>
      </div>
    );
  }

  const result = await getTenderById(session.activeOrganizationId, id);

  if (!result.success || !result.tender) {
    notFound();
  }

  return (
    <TenderForm
      organizationId={session.activeOrganizationId}
      tender={result.tender}
      mode="edit"
    />
  );
}
