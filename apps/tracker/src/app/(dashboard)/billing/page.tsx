import { getCurrentUser } from '@/server';
import { getUserUsageStats } from '@/server/billing';
import { getSubscriptionPlans } from '@pmg/db';
import { redirect } from 'next/navigation';
import BillingClient from './billing-client';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const { currentUser } = await getCurrentUser();

  if (!currentUser?.id) {
    redirect('/login');
  }

  const [usageResult, plans] = await Promise.all([
    getUserUsageStats(),
    getSubscriptionPlans(),
  ]);

  return (
    <BillingClient
      currentPlan={usageResult.plan || 'free'}
      userUpdatedAt={usageResult.userUpdatedAt}
      usage={usageResult.usage}
      invoices={usageResult.invoices || []}
      plans={plans}
    />
  );
}

