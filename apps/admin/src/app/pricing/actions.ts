"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@pmg/db";
import {
  subscriptionPlan,
  securityAuditLog,
  type SubscriptionPlan,
} from "@pmg/db/schema";
import { getSubscriptionPlans, DEFAULT_SUBSCRIPTION_PLANS } from "@pmg/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PLATFORM_ORG_ID } from "@/lib/constants";

export type PlanUpdatePayload = {
  name: string;
  description: string;
  priceZar: number;
  period: string;
  maxStorageMb: number;
  maxTendersPerMonth: number; // -1 = unlimited
  maxActiveProjects: number;
  maxOwnedOrgs: number;
  features: string[];
  popular: boolean;
  sortOrder: number;
  isActive: boolean;
  ctaText: string;
  badgeText: string | null;
};

/**
 * Fetches all platform subscription plans for the admin console.
 */
export async function getAdminSubscriptionPlans(): Promise<{
  success: boolean;
  plans: SubscriptionPlan[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return {
        success: false,
        plans: DEFAULT_SUBSCRIPTION_PLANS,
        error: "Unauthorized",
      };
    }

    const plans = await getSubscriptionPlans(true);
    return { success: true, plans };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      plans: DEFAULT_SUBSCRIPTION_PLANS,
      error: e.message || "Failed to fetch plans",
    };
  }
}

/**
 * Updates a subscription plan in the database.
 */
export async function updateSubscriptionPlanAction(
  planId: string,
  payload: PlanUpdatePayload,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    if (!payload.name?.trim()) {
      return { success: false, error: "Plan name is required." };
    }

    if (payload.priceZar < 0) {
      return { success: false, error: "Price cannot be negative." };
    }

    if (payload.maxStorageMb < 1) {
      return {
        success: false,
        error: "Storage allocation must be at least 1 MB.",
      };
    }

    const now = new Date();

    // Check if row exists
    const [existing] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, planId))
      .limit(1);

    if (existing) {
      await db
        .update(subscriptionPlan)
        .set({
          name: payload.name.trim(),
          description: payload.description.trim(),
          priceZar: Math.round(payload.priceZar),
          period: payload.period.trim() || "per month",
          maxStorageMb: Math.round(payload.maxStorageMb),
          maxTendersPerMonth: payload.maxTendersPerMonth,
          maxActiveProjects: Math.max(0, Math.round(payload.maxActiveProjects)),
          maxOwnedOrgs: Math.max(1, Math.round(payload.maxOwnedOrgs)),
          features: payload.features.filter((f) => f.trim().length > 0),
          popular: Boolean(payload.popular),
          sortOrder: payload.sortOrder ?? existing.sortOrder,
          isActive: Boolean(payload.isActive),
          ctaText: payload.ctaText.trim() || "Select Plan",
          badgeText: payload.badgeText?.trim() || null,
          updatedAt: now,
        })
        .where(eq(subscriptionPlan.id, planId));
    } else {
      // Insert if new tier
      await db.insert(subscriptionPlan).values({
        id: planId,
        name: payload.name.trim(),
        description: payload.description.trim(),
        priceZar: Math.round(payload.priceZar),
        period: payload.period.trim() || "per month",
        maxStorageMb: Math.round(payload.maxStorageMb),
        maxTendersPerMonth: payload.maxTendersPerMonth,
        maxActiveProjects: Math.max(0, Math.round(payload.maxActiveProjects)),
        maxOwnedOrgs: Math.max(1, Math.round(payload.maxOwnedOrgs)),
        features: payload.features.filter((f) => f.trim().length > 0),
        popular: Boolean(payload.popular),
        sortOrder: payload.sortOrder ?? 0,
        isActive: Boolean(payload.isActive),
        ctaText: payload.ctaText.trim() || "Select Plan",
        badgeText: payload.badgeText?.trim() || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Security Audit Log
    try {
      await db.insert(securityAuditLog).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        organizationId: PLATFORM_ORG_ID,
        userId: session.user.id,
        action: "PLATFORM_PLAN_UPDATED",
        resourceType: "subscription_plan",
        resourceId: planId,
        details: {
          planId,
          name: payload.name,
          priceZar: payload.priceZar,
          maxStorageMb: payload.maxStorageMb,
          maxTendersPerMonth: payload.maxTendersPerMonth,
          updatedBy: session.user.email,
        },
        createdAt: now,
      });
    } catch (auditErr) {
      console.warn(
        "[updateSubscriptionPlanAction] Audit logging failed:",
        auditErr,
      );
    }

    revalidatePath("/pricing");
    revalidatePath("/storage");
    revalidatePath("/reports");
    revalidatePath("/billing");

    return {
      success: true,
      message: `Tier '${payload.name}' updated successfully. Changes are live across all client apps.`,
    };
  } catch (err) {
    const e = err as Error;
    console.error("Error in updateSubscriptionPlanAction:", e);
    return {
      success: false,
      error: e.message || "Failed to update subscription plan.",
    };
  }
}

/**
 * Resets all subscription plans to factory defaults.
 */
export async function resetSubscriptionPlansAction(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required." };
    }

    for (const plan of DEFAULT_SUBSCRIPTION_PLANS) {
      await db
        .insert(subscriptionPlan)
        .values(plan)
        .onConflictDoUpdate({
          target: subscriptionPlan.id,
          set: {
            name: plan.name,
            description: plan.description,
            priceZar: plan.priceZar,
            period: plan.period,
            maxStorageMb: plan.maxStorageMb,
            maxTendersPerMonth: plan.maxTendersPerMonth,
            maxActiveProjects: plan.maxActiveProjects,
            maxOwnedOrgs: plan.maxOwnedOrgs,
            features: plan.features,
            popular: plan.popular,
            sortOrder: plan.sortOrder,
            isActive: plan.isActive,
            ctaText: plan.ctaText,
            badgeText: plan.badgeText,
            updatedAt: new Date(),
          },
        });
    }

    revalidatePath("/pricing");
    revalidatePath("/storage");
    revalidatePath("/reports");
    revalidatePath("/billing");

    return {
      success: true,
      message:
        "All subscription plans have been restored to default configurations.",
    };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      error: e.message || "Failed to reset subscription plans.",
    };
  }
}
