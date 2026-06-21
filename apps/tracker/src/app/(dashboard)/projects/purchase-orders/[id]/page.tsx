import { getCurrentUser } from '@/server';
import { getPurchaseOrderById } from '@/server/purchase-orders';
import { PODetails } from '@/components/purchase-orders/po-details';
import { getDocuments } from '@/server/documents';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PurchaseOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function PurchaseOrderPage({
  params,
}: PurchaseOrderPageProps) {
  const { id } = await params;
  const { session } = await getCurrentUser();

  // Check permissions
  const { success: hasPermission } = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        purchase_order: ['read'],
      },
    },
  });

  if (!hasPermission) {
    redirect('/dashboard');
  }

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view purchase orders.
          </p>
        </div>
      </div>
    );
  }

  const [poResult, docsResult] = await Promise.all([
    getPurchaseOrderById(session.activeOrganizationId, id),
    getDocuments(session.activeOrganizationId, 'purchase_order', id)
  ]);

  if (!poResult.success || !poResult.purchaseOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Purchase Order Not Found
          </h2>
          <p className="text-gray-600">
            The purchase order you&#x27;re looking for doesn&#x27;t exist or you
            don&#x27;t have access to it.
          </p>
        </div>
      </div>
    );
  }

  const initialDocuments = docsResult.success ? (docsResult.documents || []) : [];

  return (
    <PODetails
      po={poResult.purchaseOrder}
      organizationId={session.activeOrganizationId}
      initialDocuments={initialDocuments}
    />
  );
}
