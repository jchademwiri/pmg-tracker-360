import { getCurrentUser } from '@/server';
import { getUserUsageStats } from '@/server/billing';
import { TenderForm } from '@/components/tenders/tender-form';
import QuotaExceededTenderGate from '@/components/tenders/QuotaExceededTenderGate';
import { getOrganizationOwnerPlan } from '@/server/utils';
import { getPlanLimits } from '@pmg/db';

export const dynamic = 'force-dynamic';

export default async function NewTenderPage() {
  const { session } = await getCurrentUser();

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
  // Check against the organization owner's plan — not the current user's plan.
  const usageStats = await getUserUsageStats();
  const ownerPlan = await getOrganizationOwnerPlan(session.activeOrganizationId);
  const limits = await getPlanLimits(ownerPlan);
  const monthlyTendersCount = usageStats?.usage?.tenders || 0;
  const maxAllowed = limits.maxTendersPerMonth;

  if (monthlyTendersCount >= maxAllowed) {
    return (
      <QuotaExceededTenderGate
        currentCount={monthlyTendersCount}
        maxCount={maxAllowed}
        plan={ownerPlan}
      />
    );
  }

  return (
    <TenderForm organizationId={session.activeOrganizationId} mode="create" />
  );
}
