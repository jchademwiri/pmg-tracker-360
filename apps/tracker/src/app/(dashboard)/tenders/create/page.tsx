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

  // Quota Gate Check for Subscription Tier (Free: 10, Starter: 20, Pro: Unlimited)
  const usageStats = await getUserUsageStats();
  const userPlan = (currentUser?.plan || 'free').toLowerCase();
  const monthlyTendersCount = usageStats?.usage?.tenders || 0;
  const maxAllowed = userPlan === 'free' ? 10 : userPlan === 'starter' ? 20 : Infinity;

  if (monthlyTendersCount >= maxAllowed) {
    return (
      <QuotaExceededTenderGate
        currentCount={monthlyTendersCount}
        maxCount={maxAllowed}
        plan={userPlan}
      />
    );
  }

  return (
    <TenderForm organizationId={session.activeOrganizationId} mode="create" />
  );
}
