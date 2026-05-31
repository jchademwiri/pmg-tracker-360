import { getCurrentUser } from '@/server';
import { getUserUsageStats } from '@/server/billing';
import { redirect } from 'next/navigation';
import BillingClient from './billing-client';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const { currentUser } = await getCurrentUser();

  if (!currentUser?.id) {
    redirect('/login');
  }

  const usageResult = await getUserUsageStats();

  return (
    <BillingClient
      currentPlan={usageResult.plan || 'free'}
      usage={usageResult.usage}
    />
  );
}
