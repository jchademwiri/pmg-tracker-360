import { getCurrentUser } from '@/server';
import { getStorageAnalytics } from '@/server/storage';
import { StorageDashboard } from '@/components/storage/storage-dashboard';

export const dynamic = 'force-dynamic';

export default async function StoragePage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
          <p className="text-muted-foreground">Please select an organization to view storage usage.</p>
        </div>
      </div>
    );
  }

  const result = await getStorageAnalytics(session.activeOrganizationId);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-rose-500">Error Loading Storage Data</h2>
          <p className="text-muted-foreground">{result.error || 'Failed to load storage analytics.'}</p>
        </div>
      </div>
    );
  }

  return (
    <StorageDashboard
      organizationId={session.activeOrganizationId}
      data={result.data}
    />
  );
}
