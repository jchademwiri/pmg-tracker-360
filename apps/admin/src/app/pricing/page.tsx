import { requireAdminPage } from "@/lib/require-admin-page";
import { getSubscriptionPlans } from "@pmg/db";
import { PricingManagementClient } from "./PricingManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdminPage();
  const plans = await getSubscriptionPlans(true);

  return <PricingManagementClient initialPlans={plans} />;
}
