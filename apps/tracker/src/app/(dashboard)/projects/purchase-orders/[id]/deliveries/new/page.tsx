import { getCurrentUser } from '@/server';
import { getPurchaseOrderById } from '@/server/purchase-orders';
import { DeliveryNoteForm } from '@/components/purchase-orders/delivery-note-form';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface NewDeliveryNotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NewDeliveryNotePage({ params }: NewDeliveryNotePageProps) {
  const { id } = await params;
  const { session } = await getCurrentUser();

  const { success: hasPermission } = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        purchase_order: ['update'],
      },
    },
  });

  if (!hasPermission) {
    redirect('/dashboard');
  }

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
          <p className="text-gray-600">Please select an organization to record delivery notes.</p>
        </div>
      </div>
    );
  }

  const result = await getPurchaseOrderById(session.activeOrganizationId, id);

  if (!result.success || !result.purchaseOrder) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">Purchase Order Not Found</h2>
          <p className="text-gray-600">
            The purchase order you are recording delivery against does not exist or you do not have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DeliveryNoteForm
      organizationId={session.activeOrganizationId}
      po={result.purchaseOrder}
    />
  );
}
