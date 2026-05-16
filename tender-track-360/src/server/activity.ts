'use server';

import { db } from '@/db';
import { member, organization } from '@/db/schema';
import type {
  RecentActivity,
  ActivitySummary,
  RecentActivityResponse,
} from '@/types/activity';
import { eq, desc, inArray, and, gte } from 'drizzle-orm';
import { getCurrentUser } from './users';

/**
 * Get recent activities across all organizations the user has access to
 */
export async function getRecentActivities(
  limit: number = 10,
  offset: number = 0
): Promise<RecentActivityResponse> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Get user's organization memberships
    const userMemberships = await db.query.member.findMany({
      where: eq(member.userId, currentUser.id),
      with: {
        organization: true,
      },
    });

    if (userMemberships.length === 0) {
      return {
        activities: [],
        hasMore: false,
        totalCount: 0,
      };
    }

    const organizationIds = userMemberships.map((m) => m.organizationId);

    // For now, we'll generate activities based on member join dates and organization creation
    // In a real application, you would have a dedicated activity log table
    const activities: RecentActivity[] = [];

    // Get recent member joins across all user's organizations
    const recentMembers = await db.query.member.findMany({
      where: inArray(member.organizationId, organizationIds),
      with: {
        user: true,
        organization: true,
      },
      orderBy: [desc(member.createdAt)],
      limit: limit * 2, // Get more to filter and sort properly
    });

    // Convert member joins to activities
    for (const memberRecord of recentMembers) {
      // Skip if this is the current user's own membership (unless it's recent)
      const daysSinceJoin = Math.floor(
        (Date.now() - memberRecord.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (memberRecord.userId === currentUser.id && daysSinceJoin > 7) {
        continue;
      }

      activities.push({
        id: `member_joined_${memberRecord.id}`,
        organizationId: memberRecord.organizationId,
        organizationName: memberRecord.organization.name,
        type: 'member_joined',
        description: `${memberRecord.user.name} joined ${memberRecord.organization.name}`,
        timestamp: memberRecord.createdAt,
        userId: memberRecord.userId,
        userName: memberRecord.user.name,
        userAvatar: memberRecord.user.image || undefined,
        metadata: {
          role: memberRecord.role,
        },
      });
    }

    // Get organization creation activities
    const organizations = await db.query.organization.findMany({
      where: inArray(organization.id, organizationIds),
      orderBy: [desc(organization.createdAt)],
    });

    for (const org of organizations) {
      // Only show organization creation if it's recent (within last 30 days)
      const daysSinceCreation = Math.floor(
        (Date.now() - org.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation <= 30) {
        activities.push({
          id: `org_created_${org.id}`,
          organizationId: org.id,
          organizationName: org.name,
          type: 'organization_created',
          description: `${org.name} was created`,
          timestamp: org.createdAt,
          metadata: {
            slug: org.slug,
          },
        });
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);
    const hasMore = activities.length > offset + limit;

    return {
      activities: paginatedActivities,
      hasMore,
      totalCount: activities.length,
    };
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return {
      activities: [],
      hasMore: false,
      totalCount: 0,
    };
  }
}

/**
 * Get activity summary for organizations
 */
export async function getActivitySummaries(
  organizationIds: string[]
): Promise<Record<string, ActivitySummary>> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Verify user has access to these organizations
    const userMemberships = await db.query.member.findMany({
      where: and(
        eq(member.userId, currentUser.id),
        inArray(member.organizationId, organizationIds)
      ),
    });

    const accessibleOrgIds = userMemberships.map((m) => m.organizationId);
    const summaries: Record<string, ActivitySummary> = {};

    for (const orgId of accessibleOrgIds) {
      // Get recent member count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMembersCount = await db.query.member.findMany({
        where: and(
          eq(member.organizationId, orgId),
          gte(member.createdAt, thirtyDaysAgo)
        ),
      });

      // Get most recent activity (latest member join or org creation)
      const latestMember = await db.query.member.findFirst({
        where: eq(member.organizationId, orgId),
        orderBy: [desc(member.createdAt)],
      });

      const org = await db.query.organization.findFirst({
        where: eq(organization.id, orgId),
      });

      const lastActivity =
        latestMember && org
          ? latestMember.createdAt > org.createdAt
            ? latestMember.createdAt
            : org.createdAt
          : org?.createdAt || new Date();

      summaries[orgId] = {
        organizationId: orgId,
        lastActivity,
        activityCount: recentMembersCount.length,
        recentMembers: recentMembersCount.length,
      };
    }

    return summaries;
  } catch (error) {
    console.error('Error fetching activity summaries:', error);
    return {};
  }
}

/**
 * Get recent activities for a specific organization
 */
export async function getOrganizationActivities(
  organizationId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Verify user has access to this organization
    const userMembership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, currentUser.id),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!userMembership) {
      throw new Error('User does not have access to this organization');
    }

    const activities: RecentActivity[] = [];

    // Get recent member joins for this organization
    const recentMembers = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: {
        user: true,
        organization: true,
      },
      orderBy: [desc(member.createdAt)],
      limit,
    });

    for (const memberRecord of recentMembers) {
      activities.push({
        id: `member_joined_${memberRecord.id}`,
        organizationId: memberRecord.organizationId,
        organizationName: memberRecord.organization.name,
        type: 'member_joined',
        description: `${memberRecord.user.name} joined the organization`,
        timestamp: memberRecord.createdAt,
        userId: memberRecord.userId,
        userName: memberRecord.user.name,
        userAvatar: memberRecord.user.image || undefined,
        metadata: {
          role: memberRecord.role,
        },
      });
    }

    return activities.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch (error) {
    console.error('Error fetching organization activities:', error);
    return [];
  }
}
