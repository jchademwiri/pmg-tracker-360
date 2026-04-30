import { getTenderById } from '@/server/tenders';
import { TenderForm } from '@/components/tenders/tender-form';
import { notFound, redirect } from 'next/navigation';
import { checkUserSession } from '@/lib/session-check';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Tender' };

export default async function EditTenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');
  const { id } = await params;
  const organizationId = session.activeOrganizationId ?? 'stub-org-id';

  const result = await getTenderById(organizationId, id);

  if (!result.success || !result.tender) {
    notFound();
  }

  return (
    <TenderForm
      organizationId={organizationId}
      tender={result.tender as any}
      mode="edit"
    />
  );
}
