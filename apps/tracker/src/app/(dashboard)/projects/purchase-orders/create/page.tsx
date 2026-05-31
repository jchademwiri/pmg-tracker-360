import { getCurrentUser } from '@/server';
import { POForm } from '@/components/purchase-orders/po-form';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewPurchaseOrderPage() {
  const { session } = await getCurrentUser();

  // Check permissions
  const { success: hasPermission } = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        purchase_order: ['create'],
      },
    },
  });

  if (!hasPermission) {
    redirect('/dashboard/projects/purchase-orders'); // Or just /dashboard if they cant see list
  }

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to create purchase orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Purchase Order
          </h1>
          <p className="text-muted-foreground">
            Create a new purchase order for a project. All purchase orders must
            be linked to a specific project.
          </p>
        </div>
      </header>

      <POForm organizationId={session.activeOrganizationId} />
    </div>
  );
}
