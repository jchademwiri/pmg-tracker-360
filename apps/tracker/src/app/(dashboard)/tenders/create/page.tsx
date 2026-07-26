import { getCurrentUser } from '@/server';
import { getUserUsageStats } from '@/server/billing';
import { TenderForm } from '@/components/tenders/tender-form';
import QuotaExceededTenderGate from '@/components/tenders/QuotaExceededTenderGate';

export const dynamic = 'force-dynamic';

export default async function NewTenderPage() {
  const { session, currentUser } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to create tenders.
          </p>
        </div>
      </div>
    );
  }

  // Quota Gate Check for Free Tier
  const usageStats = await getUserUsageStats();
  const isFreePlan = (currentUser?.plan || 'free') === 'free';
  const monthlyTendersCount = usageStats?.usage?.tenders || 0;

  if (isFreePlan && monthlyTendersCount >= 20) {
    return <QuotaExceededTenderGate currentCount={monthlyTendersCount} />;
  }

  return (
    <TenderForm organizationId={session.activeOrganizationId} mode="create" />
  );
}
