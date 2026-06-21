import { getCurrentUser } from '@/server';
import { getPurchaseOrders, getUniqueSuppliers } from '@/server/purchase-orders';
import { getProjectsList } from '@/server/projects';
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

  // Fetch projects list and unique suppliers list for filters
  const projectsResult = await getProjectsList(session.activeOrganizationId);
  const suppliersResult = await getUniqueSuppliers(session.activeOrganizationId);

  const projects = projectsResult.success ? (projectsResult.projects || []) : [];
  const suppliers = suppliersResult.success ? (suppliersResult.suppliers || []) : [];

  // Parse filters from search params
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const limit = typeof resolvedSearchParams.limit === 'string' ? parseInt(resolvedSearchParams.limit, 10) : 10;
  const projectId = typeof resolvedSearchParams.projectId === 'string' ? resolvedSearchParams.projectId : undefined;
  const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;
  const supplierName = typeof resolvedSearchParams.supplier === 'string' ? resolvedSearchParams.supplier : undefined;
  const startDateStr = typeof resolvedSearchParams.startDate === 'string' ? resolvedSearchParams.startDate : undefined;
  const endDateStr = typeof resolvedSearchParams.endDate === 'string' ? resolvedSearchParams.endDate : undefined;
  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  // Fetch purchase orders with filters
  const result = await getPurchaseOrders(
    session.activeOrganizationId,
    search,
    page,
    limit,
    projectId,
    status,
    supplierName,
    startDate,
    endDate
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
            <Link href="/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Link>
          </Button>
          <Button asChild size={'lg'}>
            <Link href="/projects/purchase-orders/create">
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
        projects={projects}
        suppliers={suppliers}
      />
    </div>
  );
}
