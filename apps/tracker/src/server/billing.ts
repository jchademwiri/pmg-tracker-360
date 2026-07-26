'use server';

import { db } from '@pmg/db';
import { user as userTable, member, organization, tender } from '@pmg/db/schema';
import { eq, inArray, count, isNull, and, gte } from 'drizzle-orm';
import { getCurrentUser } from './users';

function getStartOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export async function getUserUsageStats() {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // 1. Get User's Organizations where user has 'owner' role
    const ownerMemberships = await db.query.member.findMany({
      where: and(eq(member.userId, currentUser.id), eq(member.role, 'owner')),
    });

    const ownedOrgIds = ownerMemberships.map((m) => m.organizationId);
    const organizationsCount = ownedOrgIds.length;

    // 2. Monthly Tenders Count (tenders created in the current month)
    let tendersCount = 0;
    let totalLifetimeTenders = 0;
    if (ownedOrgIds.length > 0) {
      const startOfMonth = getStartOfCurrentMonth();

      const monthlyTendersResult = await db
        .select({ count: count() })
        .from(tender)
        .where(
          and(
            inArray(tender.organizationId, ownedOrgIds),
            gte(tender.createdAt, startOfMonth),
            isNull(tender.deletedAt)
          )
        );
      tendersCount = monthlyTendersResult[0]?.count || 0;

      const lifetimeResult = await db
        .select({ count: count() })
        .from(tender)
        .where(
          and(
            inArray(tender.organizationId, ownedOrgIds),
            isNull(tender.deletedAt)
          )
        );
      totalLifetimeTenders = lifetimeResult[0]?.count || 0;
    }

    // 3. Storage placeholder
    const storageUsed = 0; // MB

    return {
      success: true,
      plan: currentUser.plan,
      usage: {
        organizations: organizationsCount,
        tenders: tendersCount, // Current Month Tenders Count against monthly quota
        lifetimeTenders: totalLifetimeTenders,
        storage: storageUsed,
      },
    };
  } catch (error) {
    console.error('Error fetching user usage stats:', error);
    return {
      success: false,
      plan: 'free',
      error: 'Failed to fetch usage stats',
      usage: {
        organizations: 0,
        tenders: 0,
        storage: 0,
      },
    };
  }
}

export async function updateUserPlan(plan: 'free' | 'starter' | 'pro') {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Server-side Downgrade Safeguard: Max orgs per plan (Free: 1, Starter: 1, Pro: 2)
    const maxOrgsForTargetPlan = plan === 'pro' ? 2 : 1;

    const ownerMemberships = await db.query.member.findMany({
      where: and(eq(member.userId, currentUser.id), eq(member.role, 'owner')),
    });

    if (ownerMemberships.length > maxOrgsForTargetPlan) {
      return {
        success: false,
        error: `Cannot downgrade plan: You currently own ${ownerMemberships.length} organizations, but the ${plan.toUpperCase()} plan limit is ${maxOrgsForTargetPlan}. Please delete or archive an organization first.`,
      };
    }

    // Execute plan update
    await db
      .update(userTable)
      .set({ plan: plan })
      .where(eq(userTable.id, currentUser.id));

    return { success: true };
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return { success: false, error: error.message || 'Failed to update plan' };
  }
}
