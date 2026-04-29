import { getCurrentUser } from '@/server';
import { POForm } from '@/components/purchase-orders/po-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create Purchase Order' };

export default async function NewPurchaseOrderPage() {
  const { session } = await getCurrentUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
        <p className="text-muted-foreground">
          Create a new purchase order linked to a project.
        </p>
      </header>
      <POForm organizationId={session.activeOrganizationId ?? 'stub-org-id'} />
    </div>
  );
}
