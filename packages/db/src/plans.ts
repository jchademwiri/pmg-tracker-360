import { db } from './client';
import { subscriptionPlan } from './schema';
import { asc, eq } from 'drizzle-orm';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type NewSubscriptionPlan,
  type PlanLimits,
} from './plans-constants';

export * from './plans-constants';

/**
 * Retrieves all subscription plans from the database, falling back to defaults if unseeded.
 */
export async function getSubscriptionPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
  try {
    const query = db.select().from(subscriptionPlan).orderBy(asc(subscriptionPlan.sortOrder));
    const plans = await query;

    if (!plans || plans.length === 0) {
      return DEFAULT_SUBSCRIPTION_PLANS.filter((p) => includeInactive || p.isActive);
    }

    if (!includeInactive) {
      return plans.filter((p) => p.isActive);
    }

    return plans;
  } catch (err) {
    console.warn('[getSubscriptionPlans] Database query failed, using in-memory plan definitions:', err);
    return DEFAULT_SUBSCRIPTION_PLANS.filter((p) => includeInactive || p.isActive);
  }
}

/**
 * Retrieves a single plan by its ID (e.g. 'free', 'starter', 'pro').
 */
export async function getSubscriptionPlan(planId?: string | null): Promise<SubscriptionPlan> {
  const normalizedId = (planId || 'free').toLowerCase().trim();

  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, normalizedId))
      .limit(1);

    if (plan) return plan;
  } catch (err) {
    // Fall back below
  }

  const defaultPlan = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.id === normalizedId);
  return defaultPlan || DEFAULT_SUBSCRIPTION_PLANS[0]!;
}

/**
 * Helper to compute numeric quota limits for a plan.
 */
export async function getPlanLimits(planId?: string | null): Promise<PlanLimits> {
  const plan = await getSubscriptionPlan(planId);
  return {
    maxStorageMb: plan.maxStorageMb,
    maxStorageBytes: plan.maxStorageMb * 1024 * 1024,
    maxTendersPerMonth: plan.maxTendersPerMonth === -1 ? Infinity : plan.maxTendersPerMonth,
    maxActiveProjects: plan.maxActiveProjects,
    maxOwnedOrgs: plan.maxOwnedOrgs,
  };
}
