import { getPurchaseOrderById } from '@/server/purchase-orders';
import { POForm } from '@/components/purchase-orders/po-form';
import { notFound, redirect } from 'next/navigation';
import { checkUserSession } from '@/lib/session-check';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Purchase Order' };

export default async function EditPurchaseOrderPage({
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

  const po = result.purchaseOrder;

  return (
    <POForm
      organizationId={organizationId}
      initialData={{
        id: po.id,
        poNumber: po.poNumber,
        projectId: po.project?.id ?? '',
        supplierName: po.supplierName ?? undefined,
        description: po.description,
        totalAmount: po.totalAmount,
        status: po.status as 'draft' | 'sent' | 'delivered',
        poDate: po.poDate ?? undefined,
        expectedDeliveryDate: po.expectedDeliveryDate ?? undefined,
        deliveryAddress: po.deliveryAddress ?? undefined,
      }}
    />
  );
}
