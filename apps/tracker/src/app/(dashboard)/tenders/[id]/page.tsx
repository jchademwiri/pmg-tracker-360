import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/server';
import { getTenderById, getTenderFollowUps } from '@/server/tenders';
import { getDocuments } from '@/server/documents';
import { getTenderExtensions } from '@/server/modules/extensions';
import { TenderDetails } from '@/components/tenders/tender-details';
import { NoOrganizationState } from '@/components/shared/empty-states';
import { formatClientName, formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface TenderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: TenderDetailPageProps): Promise<Metadata> {
  const { session } = await getCurrentUser();
  const { id } = await params;

  if (!session?.activeOrganizationId) {
    return {
      title: 'Tender Details | PMG Tracker 360',
    };
  }

  const result = await getTenderById(session.activeOrganizationId, id);
  if (!result.success || !result.tender) {
    return {
      title: 'Tender Not Found | PMG Tracker 360',
    };
  }

  const tender = result.tender;
  const clientName = tender.client?.name
    ? formatClientName(tender.client.name)
    : 'Buyer';

  return {
    title: `${tender.tenderNumber.toUpperCase()} — ${clientName} | PMG Tracker 360`,
    description:
      tender.description ||
      `Tender tracking, document vault, and validity pipeline for ${tender.tenderNumber}.`,
    openGraph: {
      title: `${tender.tenderNumber.toUpperCase()} | PMG Tracker 360`,
      description: `Status: ${tender.status} | Value: ${formatCurrency(tender.value)}`,
      type: 'website',
    },
  };
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

  const tender = result.tender;

  // JSON-LD Structured Data for search engines and AI crawlers
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: tender.tenderNumber,
    description: tender.description || `Tender opportunity ${tender.tenderNumber}`,
    serviceType: 'BiddingOpportunity',
    provider: {
      '@type': 'Organization',
      name: tender.client?.name ? formatClientName(tender.client.name) : 'Tendering Authority',
    },
    offers: {
      '@type': 'Offer',
      price: tender.value ? tender.value.replace(/[^0-9.]/g, '') : undefined,
      priceCurrency: 'ZAR',
      validThrough: tender.evaluationDate || tender.validityDate || undefined,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TenderDetails
        tender={tender}
        organizationId={session.activeOrganizationId}
        documents={documentsResult.documents || []}
        extensions={extensionsResult.data || []}
        followUps={followUpsResult.followUps || []}
      />
    </>
  );
}
