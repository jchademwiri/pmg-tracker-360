import { getCurrentUser } from '@/server';
import { getPurchaseOrders } from '@/server/purchase-orders';
import { POList } from '@/components/purchase-orders/po-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  const resolvedSearchParams = await searchParams; // Correct Promise resolution as per Next.js 15

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

  // Fetch initial purchase orders for the list component
  const result = await getPurchaseOrders(
    session.activeOrganizationId,
    '',
    1,
    10
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Track and manage all purchase orders to prevent duplicate orders and
            ensure proper fulfillment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size={'lg'}>
            <Link href="/dashboard/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Link>
          </Button>
          <Button asChild size={'lg'}>
            <Link href="/dashboard/projects/purchase-orders/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Purchase Order
            </Link>
          </Button>
        </div>
      </header>

      <POList
        organizationId={session.activeOrganizationId}
        initialPOs={result.purchaseOrders}
        initialTotalCount={result.totalCount}
      />
    </div>
  );
}
