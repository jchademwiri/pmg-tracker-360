import { db } from '@/db';
import {
  organization,
  member,
  tender,
  project,
  client,
  tenderExtension,
  type Organization,
  type Member,
} from '@/db/schema';
import { eq, and, isNotNull, count } from 'drizzle-orm';

export interface DeletionConfirmation {
  organizationName: string;
  confirmationPhrase: string;
  dataExportRequested: boolean;
  exportFormat?: 'json' | 'csv';
  deletionType: 'soft' | 'permanent';
  reason?: string;
}

export interface DeletionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  relatedDataCount: {
    tenders: number;
    projects: number;
    members: number;
    extensions: number;
  };
}

export interface OrganizationDeletionResult {
  success: boolean;
  deletionId?: string;
  deletionType: 'soft' | 'permanent';
  exportUrl?: string;
  permanentDeletionScheduledAt?: Date;
  affectedRecords: {
    tenders: number;
    projects: number;
    members: number;
    extensions: number;
  };
  error?: string;
}

export interface SoftDeletedOrganization {
  id: string;
  name: string;
  deletedAt: Date;
  deletedBy: string;
  deletionReason?: string;
  permanentDeletionScheduledAt: Date;
  daysUntilPermanentDeletion: number;
  canRestore: boolean;
  canPermanentlyDelete: boolean;
  relatedDataCount: {
    tenders: number;
    projects: number;
    members: number;
    extensions: number;
  };
}

class OrganizationDeletionManager {
  private readonly CONFIRMATION_PHRASE = 'DELETE ORGANIZATION';
  private readonly DEFAULT_SOFT_DELETE_GRACE_PERIOD_DAYS = 30;

  async validateDeletionRequest(
    organizationId: string,
    _confirmation: DeletionConfirmation,
    _userRole: string
  ): Promise<DeletionValidationResult> {
    try {
      // 1. Check if organization exists
      const org = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
        with: {
          projects: true,
        },
      });

      if (!org) {
        return {
          isValid: false,
          errors: ['Organization not found'],
          warnings: [],
          relatedDataCount: {
            tenders: 0,
            projects: 0,
            members: 0,
            extensions: 0,
          },
        };
      }

      // 2. Count related data
      const [membersCount] = await db
        .select({ count: count() })
        .from(member)
        .where(eq(member.organizationId, organizationId));
      const [tendersCount] = await db
        .select({ count: count() })
        .from(tender)
        .where(eq(tender.organizationId, organizationId));
      const [projectsCount] = await db
        .select({ count: count() })
        .from(project)
        .where(eq(project.organizationId, organizationId));
      const [extensionsCount] = await db
        .select({ count: count() })
        .from(tenderExtension)
        .where(eq(tenderExtension.organizationId, organizationId));

      const relatedDataCount = {
        members: membersCount?.count || 0,
        tenders: tendersCount?.count || 0,
        projects: projectsCount?.count || 0,
        extensions: extensionsCount?.count || 0,
      };

      // 3. Check for active interactions (contracts/projects)
      // This maps to "Active Contracts" in the requirements
      const activeProjects = org.projects.filter((p) => p.status === 'active');

      const warnings: string[] = [];
      if (activeProjects.length > 0) {
        warnings.push(`There are ${activeProjects.length} active projects.`);
      }

      if (relatedDataCount.members > 1) {
        warnings.push(
          `There are ${relatedDataCount.members} members in this organization.`
        );
      }

      return {
        isValid: true,
        errors: [],
        warnings,
        relatedDataCount,
      };
    } catch (error) {
      console.error('Error validating deletion request:', error);
      return {
        isValid: false,
        errors: ['An unexpected error occurred during validation'],
        warnings: [],
        relatedDataCount: {
          tenders: 0,
          projects: 0,
          members: 0,
          extensions: 0,
        },
      };
    }
  }

  async generateDeletionToken(): Promise<string> {
    return crypto.randomUUID();
  }

  async exportOrganizationData(
    organizationId: string,
    format: 'json' | 'csv',
    userId: string
  ): Promise<string | null> {
    try {
      console.log(`Exporting data for org ${organizationId} by ${userId}`);

      // Fetch all organization data with relations
      const orgData = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
        with: {
          members: {
            with: { user: true },
          },
          tenders: {
            with: { client: true },
          },
          projects: {
            with: { purchaseOrders: true },
          },
          clients: true,
        },
      });

      if (!orgData) return null;

      if (format === 'json') {
        const jsonString = JSON.stringify(orgData, null, 2);
        // Create a Data URI for immediate download
        const base64Data = Buffer.from(jsonString).toString('base64');
        return `data:application/json;base64,${base64Data}`;
      } else {
        // Simple CSV implementation for MVP (Organization details only)
        // In a real app, we'd probably want multiple CSVs (zip) or a complex flattening
        const headers = ['id', 'name', 'slug', 'createdAt'].join(',');
        const row = [
          orgData.id,
          orgData.name,
          orgData.slug,
          orgData.createdAt,
        ].join(',');
        const csvContent = `${headers}\n${row}`;
        const base64Data = Buffer.from(csvContent).toString('base64');
        return `data:text/csv;base64,${base64Data}`;
      }
    } catch (error) {
      console.error('Error exporting data', error);
      return null;
    }
  }

  async softDeleteOrganization(
    organizationId: string,
    userId: string,
    confirmation: DeletionConfirmation
  ): Promise<OrganizationDeletionResult> {
    try {
      // Check if organization exists and is not already deleted
      const org = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
      });

      if (!org) {
        return {
          success: false,
          deletionType: 'soft',
          affectedRecords: {
            tenders: 0,
            projects: 0,
            members: 0,
            extensions: 0,
          },
          error: 'Organization not found',
        };
      }

      if (org.deletedAt) {
        return {
          success: false,
          deletionType: 'soft',
          affectedRecords: {
            tenders: 0,
            projects: 0,
            members: 0,
            extensions: 0,
          },
          error: 'Organization is already deleted',
        };
      }

      // Calculate permanent deletion date (30 days from now)
      const permanentDeletionDate = new Date(
        Date.now() +
          this.DEFAULT_SOFT_DELETE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );

      // Update organization with soft deletion fields
      await db
        .update(organization)
        .set({
          deletedAt: new Date(),
          deletedBy: userId,
          deletionReason: confirmation.reason || null,
          permanentDeletionScheduledAt: permanentDeletionDate,
        })
        .where(eq(organization.id, organizationId));

      return {
        success: true,
        deletionId: crypto.randomUUID(),
        deletionType: 'soft',
        permanentDeletionScheduledAt: permanentDeletionDate,
        affectedRecords: { tenders: 0, projects: 0, members: 0, extensions: 0 },
      };
    } catch (error) {
      console.error('Error soft deleting organization:', error);
      return {
        success: false,
        deletionType: 'soft',
        affectedRecords: { tenders: 0, projects: 0, members: 0, extensions: 0 },
        error: 'Failed to delete organization',
      };
    }
  }

  async restoreOrganization(
    organizationId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `Restoring organization ${organizationId} by user ${userId} with reason: ${reason}`
      );

      // Check if organization exists and is actually deleted
      const org = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
      });

      if (!org) {
        return { success: false, error: 'Organization not found' };
      }

      if (!org.deletedAt) {
        return { success: false, error: 'Organization is not deleted' };
      }

      await db
        .update(organization)
        .set({
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          permanentDeletionScheduledAt: null,
        })
        .where(eq(organization.id, organizationId));

      return { success: true };
    } catch (error) {
      console.error('Error restoring organization:', error);
      return { success: false, error: 'Failed to restore organization' };
    }
  }

  async permanentlyDeleteOrganization(
    organizationId: string,
    userId: string,
    reason?: string
  ): Promise<OrganizationDeletionResult> {
    try {
      console.log(
        `Permanently deleting organization ${organizationId} by user ${userId} with reason: ${reason}`
      );

      // Check if organization exists
      const org = await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
      });

      if (!org) {
        return {
          success: false,
          deletionType: 'permanent',
          affectedRecords: {
            tenders: 0,
            projects: 0,
            members: 0,
            extensions: 0,
          },
          error: 'Organization not found',
        };
      }

      // 0. Use a transaction for atomicity
      return await db.transaction(async (tx) => {
        // 1. Delete all related data first (though cascading delete handles most references, being explicit is safer/clearer for some logic)
        // However, with `onDelete: 'cascade'` defined in schema, deleting the organization triggers cascading deletes.
        // Let's rely on the cascading delete for efficiency, but we'll fetch counts first to return accurate stats.

        const [membersCount] = await tx
          .select({ count: count() })
          .from(member)
          .where(eq(member.organizationId, organizationId));
        const [tendersCount] = await tx
          .select({ count: count() })
          .from(tender)
          .where(eq(tender.organizationId, organizationId));
        const [projectsCount] = await tx
          .select({ count: count() })
          .from(project)
          .where(eq(project.organizationId, organizationId));

        // Delete the organization - this will cascade to members, projects, tenders etc.
        await tx
          .delete(organization)
          .where(eq(organization.id, organizationId));

        return {
          success: true,
          deletionType: 'permanent',
          affectedRecords: {
            tenders: tendersCount?.count || 0,
            projects: projectsCount?.count || 0,
            members: membersCount?.count || 0,
            extensions: 0, // Cascade handles these
          },
        };
      });
    } catch (error) {
      console.error('Error permanently deleting organization:', error);
      return {
        success: false,
        deletionType: 'permanent',
        affectedRecords: { tenders: 0, projects: 0, members: 0, extensions: 0 },
        error: 'Failed to permanently delete organization',
      };
    }
  }

  async getSoftDeletedOrganizations(
    userId: string
  ): Promise<SoftDeletedOrganization[]> {
    try {
      const deletedOrgs = await db.query.organization.findMany({
        where: and(
          isNotNull(organization.deletedAt),
          eq(organization.deletedBy, userId) // Only show orgs deleted by this user? Or maybe all deleted orgs if they are owner?
          // Since we don't have a clear "owner" link after deletion (member table might be cleared or relations invalid),
          // relying on `deletedBy` is a safe bet for "My Deleted Organizations"
        ),
      });

      return deletedOrgs.map((org) => ({
        id: org.id,
        name: org.name,
        deletedAt: org.deletedAt!,
        deletedBy: org.deletedBy!,
        deletionReason: org.deletionReason || undefined,
        permanentDeletionScheduledAt: org.permanentDeletionScheduledAt!,
        daysUntilPermanentDeletion: Math.max(
          0,
          Math.ceil(
            (org.permanentDeletionScheduledAt!.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        canRestore: true,
        canPermanentlyDelete: true,
        relatedDataCount: {
          tenders: 0,
          projects: 0,
          members: 0,
          extensions: 0,
        }, // Fetch real counts if needed
      }));
    } catch (error) {
      console.error('Error fetching soft deleted orgs', error);
      return [];
    }
  }

  async forcePermanentDeletion(
    organizationId: string,
    userId: string,
    userRole: string,
    reason: string
  ): Promise<OrganizationDeletionResult> {
    if (userRole !== 'owner') {
      return {
        success: false,
        deletionType: 'permanent',
        affectedRecords: { tenders: 0, projects: 0, members: 0, extensions: 0 },
        error: 'Only organization owners can force permanent deletion',
      };
    }

    return await this.permanentlyDeleteOrganization(
      organizationId,
      userId,
      reason
    );
  }
}

export const organizationDeletionManager = new OrganizationDeletionManager();
