'use server';

import { db } from '@pmg/db';
import { member, organization, invitation, user, project } from '@pmg/db/schema';
import type { Role } from '@pmg/db/schema';

type Organization = typeof organization.$inferSelect;

import { eq, inArray, and, isNull } from 'drizzle-orm';
import { count } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { getCurrentUser } from './users';
import { StorageService } from '@/lib/storage';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

// Enhanced organization data with member counts and user roles
export interface OrganizationWithStats extends Organization {
  memberCount: number;
  userRole: Role;
  lastActivity?: Date;
}

export async function getorganizations(): Promise<OrganizationWithStats[]> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Get user's memberships with role information (including soft-deleted organizations for the list)
    const userMemberships = await db.query.member.findMany({
      where: eq(member.userId, currentUser.id),
      with: {
        organization: true,
      },
    });

    if (userMemberships.length === 0) {
      return [];
    }

    // Get organizations with enhanced data (including soft-deleted ones for the organization list)
    const organizationsWithStats: OrganizationWithStats[] = await Promise.all(
      userMemberships.map(async (membership) => {
        // Get member count for this organization
        const memberCountResult = await db
          .select({ count: count() })
          .from(member)
          .where(eq(member.organizationId, membership.organizationId));

        const memberCount = memberCountResult[0]?.count || 0;

        return {
          ...membership.organization,
          memberCount,
          userRole: membership.role as Role,
          lastActivity: membership.organization.createdAt, // Placeholder for now
        };
      })
    );

    return organizationsWithStats;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw new Error('Failed to fetch organizations');
  }
}

// Function specifically for sidebar - excludes soft-deleted organizations
export async function getActiveOrganizations(): Promise<
  OrganizationWithStats[]
> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Get user's memberships with role information, excluding soft-deleted organizations
    const userMemberships = await db.query.member.findMany({
      where: eq(member.userId, currentUser.id),
      with: {
        organization: true,
      },
    });

    // Filter out soft-deleted organizations for sidebar
    const activeMemberships = userMemberships.filter(
      (membership) => !membership.organization.deletedAt
    );

    if (activeMemberships.length === 0) {
      return [];
    }

    // Get organizations with enhanced data (only active ones for sidebar)
    const organizationsWithStats: OrganizationWithStats[] = await Promise.all(
      activeMemberships.map(async (membership) => {
        // Get member count for this organization
        const memberCountResult = await db
          .select({ count: count() })
          .from(member)
          .where(eq(member.organizationId, membership.organizationId));

        const memberCount = memberCountResult[0]?.count || 0;

        let logoUrl = membership.organization.logo;
        if (logoUrl && !logoUrl.startsWith('http')) {
          logoUrl = await StorageService.getSignedUrl(logoUrl);
        }

        return {
          ...membership.organization,
          logo: logoUrl,
          memberCount,
          userRole: membership.role as Role,
          lastActivity: membership.organization.createdAt,
        };
      })
    );

    return organizationsWithStats;
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Error fetching active organizations:', error);
    throw new Error('Failed to fetch active organizations');
  }
}

export async function getOrganizationsForProvider() {
  const { currentUser } = await getCurrentUser();
  const members = await db.query.member.findMany({
    where: eq(member.userId, currentUser?.id),
  });
  const organizations = await db.query.organization.findMany({
    where: and(
      inArray(
        organization.id,
        members.map((m) => m.organizationId)
      ),
      isNull(organization.deletedAt) // Filter out soft-deleted organizations from sidebar
    ),
  });
  // Map to match the expected type for OrganizationProvider
  return organizations.map((org) => ({
    id: org.id,
    slug: org.slug || org.id, // Use ID as fallback if slug is null
    name: org.name,
  }));
}

export async function getActiveOrganization(userId: string) {
  const memberUser = await db.query.member.findFirst({
    where: eq(member.userId, userId),
  });

  if (!memberUser) {
    return null;
  }

  const activeOrganization = await db.query.organization.findFirst({
    where: eq(organization.id, memberUser.organizationId),
  });

  return activeOrganization;
}

export async function getUserOrganizationMembership(
  userId: string,
  organizationId: string
) {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId)
    ),
    with: {
      organization: true,
    },
  });

  return membership;
}

export async function getOrganizationBySlug(slug: string) {
  try {
    const organizationBySlug = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });
    return organizationBySlug;
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    return null;
  }
}

// Get organization by slug with user role information
export async function getOrganizationBySlugWithUserRole(slug: string) {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    const organizationBySlug = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!organizationBySlug) {
      return null;
    }

    // Get user's role in this organization
    const userMembership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, currentUser.id),
        eq(member.organizationId, organizationBySlug.id)
      ),
    });

    // Get member count
    const memberCountResult = await db
      .select({ count: count() })
      .from(member)
      .where(eq(member.organizationId, organizationBySlug.id));

    const memberCount = memberCountResult[0]?.count || 0;

    // Get active projects count
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(project)
      .where(
        and(
          eq(project.organizationId, organizationBySlug.id),
          eq(project.status, 'active'),
          isNull(project.deletedAt)
        )
      );

    const activeProjects = activeProjectsResult[0]?.count || 0;

    // Generate signed URL for logo if it exists
    if (
      organizationBySlug.logo &&
      !organizationBySlug.logo.startsWith('http')
    ) {
      organizationBySlug.logo = await StorageService.getSignedUrl(
        organizationBySlug.logo
      );
    }

    return {
      ...organizationBySlug,
      userRole: userMembership?.role as Role,
      memberCount,
      activeProjects,
    };
  } catch (error) {
    console.error('Error fetching organization by slug with user role:', error);
    return null;
  }
}

// Organization statistics interface
export interface OrganizationStats {
  memberCount: number;
  lastActivity: Date;
  activeProjects?: number;
  recentUpdates?: number;
}

// Get detailed statistics for a specific organization
export async function getOrganizationStats(
  organizationId: string
): Promise<OrganizationStats | null> {
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

    // Get member count
    const memberCountResult = await db
      .select({ count: count() })
      .from(member)
      .where(eq(member.organizationId, organizationId));

    const memberCount = memberCountResult[0]?.count || 0;

    // Get organization details for last activity
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    return {
      memberCount,
      lastActivity: org.createdAt, // Placeholder - in real app this would be actual last activity
      activeProjects: 0, // Placeholder - would be calculated from projects table
      recentUpdates: 0, // Placeholder - would be calculated from activity logs
    };
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return null;
  }
}

// Get statistics for multiple organizations
export async function getOrganizationsStats(
  organizationIds: string[]
): Promise<Record<string, OrganizationStats>> {
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
    const stats: Record<string, OrganizationStats> = {};

    // Get stats for each accessible organization
    await Promise.all(
      accessibleOrgIds.map(async (orgId) => {
        const orgStats = await getOrganizationStats(orgId);
        if (orgStats) {
          stats[orgId] = orgStats;
        }
      })
    );

    return stats;
  } catch (error) {
    console.error('Error fetching organizations stats:', error);
    return {};
  }
}

// Organization member interface for member data
export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  joinedAt: Date;
  lastActive?: Date;
}

// Invitation interface for pending invitations
export interface PendingInvitation {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: Date;
  invitedAt: Date;
  inviterName: string;
}

// Get all members of an organization
export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMember[]> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Verify user has access to this organization
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );
    if (!userMembership) {
      throw new Error('Access denied to this organization');
    }

    // Fetch all members of the organization
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: [desc(member.createdAt)],
    });

    return members.map((memberRecord) => ({
      id: memberRecord.id,
      userId: memberRecord.userId,
      name: memberRecord.user.name,
      email: memberRecord.user.email,
      image: memberRecord.user.image,
      role: memberRecord.role as Role,
      joinedAt: memberRecord.createdAt,
      lastActive: memberRecord.user.createdAt, // You might want to add a lastActive field to user table
    }));
  } catch (error) {
    console.error('Error fetching organization members:', error);
    throw new Error('Failed to fetch organization members');
  }
}

// Get pending invitations for an organization
export async function getPendingInvitations(
  organizationId: string
): Promise<PendingInvitation[]> {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Verify user has access to this organization
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );

    if (!userMembership) {
      throw new Error('User does not have access to this organization');
    }

    // Only owners and admins can view pending invitations
    if (!['owner', 'admin'].includes(userMembership.role)) {
      throw new Error('Insufficient permissions to view invitations');
    }

    // Get pending invitations with inviter information
    const pendingInvitations = await db.query.invitation.findMany({
      where: and(
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, 'pending')
      ),
      with: {
        // We need to add the inviter relation to get the inviter's name
      },
    });

    // Get inviter names separately since we don't have the relation set up
    const invitationsWithInviterNames = await Promise.all(
      pendingInvitations.map(async (inv) => {
        const inviter = await db.query.user.findFirst({
          where: eq(user.id, inv.inviterId),
        });

        return {
          id: inv.id,
          email: inv.email,
          role: inv.role as Role,
          status: inv.status,
          expiresAt: inv.expiresAt,
          invitedAt: new Date(), // We'll use current date as placeholder since invitation table doesn't have createdAt
          inviterName: inviter?.name || 'Unknown',
        };
      })
    );

    return invitationsWithInviterNames;
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    throw new Error('Failed to fetch pending invitations');
  }
}

export async function updateOrganizationLogo(
  organizationId: string,
  formData: FormData
) {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user has access to this organization and has appropriate role
    const userMembership = await getUserOrganizationMembership(
      currentUser.id,
      organizationId
    );

    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // specific validation for images
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = file.name.split('.').pop() || 'jpg';

    // Fetch organization details (name for path, logo for cleanup)
    // Fetch organization details (name for path, logo for cleanup, slug for folder)
    const orgDetails = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: {
        name: true,
        logo: true,
        slug: true,
      },
    });

    // Sanitize org name for folder path
    const orgIdentifier = orgDetails?.slug || orgDetails?.name || 'org';
    const safeIdentifier = orgIdentifier
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const timestamp = Date.now();
    const uniqueKey = `organizations/${safeIdentifier}/logo/logo-${timestamp}.${fileExtension}`;

    const storageKey = await StorageService.uploadFile(
      buffer,
      uniqueKey,
      file.type
    );

    // Update organization record
    await db
      .update(organization)
      .set({ logo: storageKey })
      .where(eq(organization.id, organizationId));

    // Cleanup: Delete old logo if it exists (perform AFTER successful upload and DB update)
    if (orgDetails?.logo && !orgDetails.logo.startsWith('http')) {
      try {
        await StorageService.deleteFile(orgDetails.logo);
      } catch (e) {
        console.error('Failed to delete old organization logo:', e);
        // Do not fail the request if cleanup fails, as the new logo is already live
      }
    }

    revalidatePath(`/dashboard/organization/${organizationId}/settings`); // Revalidate settings page
    revalidatePath('/dashboard/organization'); // Revalidate list
    revalidatePath('/dashboard'); // Revalidate sidebar potentially

    // Return signed URL for immediate display
    const signedUrl = await StorageService.getSignedUrl(storageKey);

    return { success: true, imageUrl: signedUrl };
  } catch (error) {
    console.error('Error updating organization logo:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    return {
      success: false,
      error:
        'Failed to update organization logo: ' +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
