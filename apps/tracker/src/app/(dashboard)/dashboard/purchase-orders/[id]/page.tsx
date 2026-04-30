import { getPurchaseOrderById } from '@/server/purchase-orders';
import { PODetails } from '@/components/purchase-orders/po-details';
import { notFound, redirect } from 'next/navigation';
import { checkUserSession } from '@/lib/session-check';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');
  const { id } = await params;
  const organizationId = session.activeOrganizationId ?? 'stub-org-id';

  const result = await getPurchaseOrderById(organizationId, id);

  if (!result.success || !result.purchaseOrder) {
    notFound();
  }

  return (
    <PODetails
      po={result.purchaseOrder as any}
      organizationId={organizationId}
    />
  );
}
