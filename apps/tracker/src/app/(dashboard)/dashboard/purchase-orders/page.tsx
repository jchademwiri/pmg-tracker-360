import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { getPurchaseOrders } from '@/server/purchase-orders';
import { PurchaseOrdersTable } from '@/components/purchase-orders/purchase-orders-table';
import { Button } from '@pmg/ui/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Purchase Orders' };

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');

  const params = await searchParams;
  const organizationId = session.activeOrganizationId!;
  const page = parseInt(params.page ?? '1');

  const result = await getPurchaseOrders(organizationId, params.search, page, 10, undefined, params.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Track purchase orders across all projects.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchase-orders/create">
            <Plus className="mr-2 h-4 w-4" />
            New PO
          </Link>
        </Button>
      </div>
      <PurchaseOrdersTable
        purchaseOrders={result.purchaseOrders}
        totalCount={result.totalCount}
        currentPage={result.currentPage}
        totalPages={result.totalPages}
      />
    </div>
  );
}
