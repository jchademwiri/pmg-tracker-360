import { getCurrentUser } from '@/server';
import { getTenderById, getTenderFollowUps } from '@/server/tenders';
import { getDocuments } from '@/server/documents';
import { getTenderExtensions } from '@/server/modules/extensions';
import { TenderDetails } from '@/components/tenders/tender-details';
import { notFound } from 'next/navigation';
import { NoOrganizationState } from '@/components/shared/empty-states';

export const dynamic = 'force-dynamic';

interface TenderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TenderDetailPage({
  params,
}: TenderDetailPageProps) {
  const { session } = await getCurrentUser();
  const { id } = await params;

  if (!session.activeOrganizationId) {
    return <NoOrganizationState />;
  }

  const result = await getTenderById(session.activeOrganizationId, id);
  const documentsResult = await getDocuments(
    session.activeOrganizationId,
    'tender',
    id
  );
  const extensionsResult = await getTenderExtensions(
    session.activeOrganizationId,
    id
  );
  const followUpsResult = await getTenderFollowUps(
    session.activeOrganizationId,
    id
  );

  if (!result.success || !result.tender) {
    notFound();
  }

  return (
    <TenderDetails
      tender={result.tender}
      organizationId={session.activeOrganizationId}
      documents={documentsResult.documents || []}
      extensions={extensionsResult.data || []}
      followUps={followUpsResult.followUps || []}
    />
  );
}
