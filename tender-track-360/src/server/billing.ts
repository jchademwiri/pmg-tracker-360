'use server';

import { db } from '@/db';
import { schema } from '@/db/schema';
import { member, organization, tender } from '@/db/schema';
import { eq, inArray, count, isNull, and } from 'drizzle-orm';
import { getCurrentUser } from './users';

export async function getUserUsageStats() {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // 1. Get User's Organizations
    // We count memberships where user is owner or admin?
    // Usually billing limits "Owned" organizations.
    // For now, let's count all stats for organizations where the user is a member,
    // OR we assume the "Pro" plan applies to the user's ability to CREATE organizations.
    // Let's count all organizations the user belongs to for now, or distinct orgs.

    // Actually, "1 Organization" limit usually means "You can own 1 organization".
    // Let's find organizations where user.id is the creator?
    // Schema might not have 'creatorId' on organization, usually inferred from 'owner' role in members.

    // Let's count organizations where user has 'owner' role
    const ownerMemberships = await db.query.member.findMany({
      where: and(eq(member.userId, currentUser.id), eq(member.role, 'owner')),
    });

    // If we want to show "Usage", maybe we show total orgs they are in?
    // But limits usually apply to ownership.
    // Let's assume the limit is on "Owned Organizations".
    const ownedOrgIds = ownerMemberships.map((m) => m.organizationId);
    const organizationsCount = ownedOrgIds.length;

    // 2. Teners Count
    // If the plan limit is "Unlimited tenders", we still might want to show how many they have.
    // Let's count tenders in all owned organizations.
    let tendersCount = 0;
    if (ownedOrgIds.length > 0) {
      const tendersResult = await db
        .select({ count: count() })
        .from(tender)
        .where(
          and(
            inArray(tender.organizationId, ownedOrgIds),
            isNull(tender.deletedAt)
          )
        );
      tendersCount = tendersResult[0]?.count || 0;
    }

    // 3. Storage
    // Placeholder as we don't have file tracking yet.
    const storageUsed = 0; // MB

    return {
      success: true,
      plan: currentUser.plan, // Return the user's plan
      usage: {
        organizations: organizationsCount,
        tenders: tendersCount,
        storage: storageUsed,
      },
    };
  } catch (error) {
    console.error('Error fetching user usage stats:', error);
    return {
      success: false,
      plan: 'free', // Default fallback
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

    // In a real app, this would verify payment via webhook
    // For now, we simulate the update

    // Use raw query or any if types are not yet perfect
    // but Drizzle should know about 'plan' if schema is updated and types generated

    // Note: Drizzle types might need regeneration. If explicit typing fails, we might need a raw query or cast.
    // Assuming schema change in db/schema.ts is picked up by runtime imports and Drizzle types if we were running generation,
    // but in this environment we might rely on 'any' cast if types are stale.

    // Let's try standard update first.
    await db
      .update(schema.user)
      .set({ plan: plan })
      .where(eq(schema.user.id, currentUser.id));

    return { success: true };
  } catch (error: any) {
    console.error('Error updating plan:', error);
    // Return the actual error message for debugging
    return { success: false, error: error.message || 'Failed to update plan' };
  }
}
