import { getCurrentUser } from '@/server';
import { getTenderById } from '@/server/tenders';
import { getClients } from '@/server/clients';
import { TenderForm } from '@/components/tenders/tender-form';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Tender' };

export default async function EditTenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session } = await getCurrentUser();
  const { id } = await params;
  const organizationId = session.activeOrganizationId ?? 'stub-org-id';

  const [tenderResult, clientsResult] = await Promise.all([
    getTenderById(organizationId, id),
    getClients(organizationId),
  ]);

  if (!tenderResult.success || !tenderResult.tender) {
    notFound();
  }

  return (
    <TenderForm
      organizationId={organizationId}
      tender={tenderResult.tender as any}
      clients={clientsResult.clients}
      mode="edit"
    />
  );
}
