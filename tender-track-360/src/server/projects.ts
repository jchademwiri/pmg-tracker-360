'use server';

import { db } from '@/db';
import {
  project,
  client,
  tender,
  purchaseOrder,
  organization,
} from '@/db/schema';
import { eq, and, isNull, ilike, or, desc, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  ProjectCreateSchema,
  ProjectUpdateSchema,
  ProjectStatusUpdateSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ProjectStatusUpdateInput,
} from '@/lib/validations/project';
import type { RecentActivity } from '@/types/activity';

// Get projects with pagination, search, and client joins
export async function getProjects(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  try {
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(project.organizationId, organizationId),
      isNull(project.deletedAt)
    );

    // Add search condition if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(project.projectNumber, searchTerm),
          ilike(project.description, searchTerm)
        )
      );
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereCondition = and(whereCondition, eq(project.status, status));
    }

    const projects = await db
      .select({
        id: project.id,
        projectNumber: project.projectNumber,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
        tender: {
          id: tender.id,
          tenderNumber: tender.tenderNumber,
          description: tender.description,
        },
      })
      .from(project)
      .leftJoin(client, eq(project.clientId, client.id))
      .leftJoin(tender, eq(project.tenderId, tender.id))
      .where(whereCondition)
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: project.id })
      .from(project)
      .where(whereCondition);

    return {
      projects,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

// Create a new project
export async function createProject(
  organizationId: string,
  data: ProjectCreateInput
) {
  try {
    // Validate input
    const validatedData = ProjectCreateSchema.parse(data);

    // Check if project number is unique within organization
    const existingProject = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.projectNumber, validatedData.projectNumber.toUpperCase()),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (existingProject.length > 0) {
      return {
        success: false,
        error: 'Project number already exists in this organization',
      };
    }

    // Verify client exists and belongs to organization if provided
    if (validatedData.clientId) {
      const clientExists = await db
        .select()
        .from(client)
        .where(
          and(
            eq(client.id, validatedData.clientId),
            eq(client.organizationId, organizationId),
            isNull(client.deletedAt)
          )
        )
        .limit(1);

      if (clientExists.length === 0) {
        return { success: false, error: 'Client not found' };
      }
    }

    // Verify tender exists and belongs to organization if provided
    if (validatedData.tenderId) {
      const tenderExists = await db
        .select()
        .from(tender)
        .where(
          and(
            eq(tender.id, validatedData.tenderId),
            eq(tender.organizationId, organizationId),
            isNull(tender.deletedAt)
          )
        )
        .limit(1);

      if (tenderExists.length === 0) {
        return { success: false, error: 'Tender not found' };
      }
    }

    const newProject = await db
      .insert(project)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        ...validatedData,
        projectNumber: validatedData.projectNumber.toUpperCase(),
      })
      .returning();

    revalidatePath('/dashboard/projects');
    return { success: true, project: newProject[0] };
  } catch (error) {
    console.error('Error creating project:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: 'Failed to create project' };
  }
}

// Get project by ID with client and tender information
export async function getProjectById(
  organizationId: string,
  projectId: string
) {
  try {
    const projectData = await db
      .select({
        id: project.id,
        projectNumber: project.projectNumber,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
        tender: {
          id: tender.id,
          tenderNumber: tender.tenderNumber,
          description: tender.description,
          value: tender.value,
          submissionDate: tender.submissionDate,
        },
      })
      .from(project)
      .leftJoin(client, eq(project.clientId, client.id))
      .leftJoin(tender, eq(project.tenderId, tender.id))
      .where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (projectData.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project: projectData[0] };
  } catch (error) {
    console.error('Error fetching project:', error);
    return { success: false, error: 'Failed to fetch project' };
  }
}

// Get recent project and PO activities for an organization
export async function getRecentProjectActivities(
  organizationId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];

    // Get organization name
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) {
      return [];
    }

    // Get recent projects (created and status changes)
    const recentProjects = await db
      .select({
        id: project.id,
        projectNumber: project.projectNumber,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: {
          name: client.name,
        },
      })
      .from(project)
      .leftJoin(client, eq(project.clientId, client.id))
      .where(
        and(
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .orderBy(desc(project.updatedAt))
      .limit(limit * 2); // Get more to filter

    // Generate activities from projects
    for (const proj of recentProjects) {
      // Project created activity
      activities.push({
        id: `project_created_${proj.id}`,
        organizationId,
        organizationName: org.name,
        type: 'project_created',
        description: `Project ${proj.projectNumber} was created${proj.client?.name ? ` for ${proj.client.name}` : ''}`,
        timestamp: proj.createdAt,
        metadata: {
          projectId: proj.id,
          projectNumber: proj.projectNumber,
          clientName: proj.client?.name,
        },
      });

      // If project was recently updated and status changed, add status change activity
      // For now, we'll assume updatedAt indicates a status change if it's different from createdAt
      if (proj.updatedAt.getTime() !== proj.createdAt.getTime()) {
        activities.push({
          id: `project_status_${proj.id}_${proj.updatedAt.getTime()}`,
          organizationId,
          organizationName: org.name,
          type: 'project_status_changed',
          description: `Project ${proj.projectNumber} status changed to ${proj.status}`,
          timestamp: proj.updatedAt,
          metadata: {
            projectId: proj.id,
            projectNumber: proj.projectNumber,
            newStatus: proj.status,
          },
        });
      }
    }

    // Get recent purchase orders
    const recentPOs = await db
      .select({
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        description: purchaseOrder.description,
        status: purchaseOrder.status,
        totalAmount: purchaseOrder.totalAmount,
        createdAt: purchaseOrder.createdAt,
        updatedAt: purchaseOrder.updatedAt,
        deliveredAt: purchaseOrder.deliveredAt,
        project: {
          projectNumber: project.projectNumber,
        },
      })
      .from(purchaseOrder)
      .leftJoin(project, eq(purchaseOrder.projectId, project.id))
      .where(
        and(
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt)
        )
      )
      .orderBy(desc(purchaseOrder.updatedAt))
      .limit(limit * 2);

    // Generate activities from POs
    for (const po of recentPOs) {
      // PO created activity
      activities.push({
        id: `po_created_${po.id}`,
        organizationId,
        organizationName: org.name,
        type: 'po_created',
        description: `Purchase Order ${po.poNumber} was created for project ${po.project?.projectNumber || 'Unknown'}`,
        timestamp: po.createdAt,
        metadata: {
          poId: po.id,
          poNumber: po.poNumber,
          projectNumber: po.project?.projectNumber,
          amount: po.totalAmount,
        },
      });

      // PO status changed activity
      if (po.updatedAt.getTime() !== po.createdAt.getTime()) {
        activities.push({
          id: `po_status_${po.id}_${po.updatedAt.getTime()}`,
          organizationId,
          organizationName: org.name,
          type: 'po_status_changed',
          description: `Purchase Order ${po.poNumber} status changed to ${po.status}`,
          timestamp: po.updatedAt,
          metadata: {
            poId: po.id,
            poNumber: po.poNumber,
            newStatus: po.status,
          },
        });
      }

      // PO delivered activity
      if (po.deliveredAt) {
        activities.push({
          id: `po_delivered_${po.id}`,
          organizationId,
          organizationName: org.name,
          type: 'po_delivered',
          description: `Purchase Order ${po.poNumber} was delivered`,
          timestamp: po.deliveredAt,
          metadata: {
            poId: po.id,
            poNumber: po.poNumber,
          },
        });
      }
    }

    // Sort all activities by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent project activities:', error);
    return [];
  }
}

// Update project
export async function updateProject(
  organizationId: string,
  projectId: string,
  data: ProjectUpdateInput
) {
  try {
    // Validate input
    const validatedData = ProjectUpdateSchema.parse(data);

    // Check if project exists and belongs to organization
    const existingProject = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (existingProject.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    // If project number is being updated, check uniqueness
    if (validatedData.projectNumber) {
      const duplicateProject = await db
        .select()
        .from(project)
        .where(
          and(
            eq(
              project.projectNumber,
              validatedData.projectNumber.toUpperCase()
            ),
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt),
            // Exclude current project from uniqueness check
            ne(project.id, projectId)
          )
        )
        .limit(1);

      if (duplicateProject.length > 0) {
        return {
          success: false,
          error: 'Project number already exists in this organization',
        };
      }
    }

    // If client is being updated, verify it exists and belongs to organization
    if (validatedData.clientId) {
      const clientExists = await db
        .select()
        .from(client)
        .where(
          and(
            eq(client.id, validatedData.clientId),
            eq(client.organizationId, organizationId),
            isNull(client.deletedAt)
          )
        )
        .limit(1);

      if (clientExists.length === 0) {
        return { success: false, error: 'Client not found' };
      }
    }

    // If tender is being updated, verify it exists and belongs to organization
    if (validatedData.tenderId) {
      const tenderExists = await db
        .select()
        .from(tender)
        .where(
          and(
            eq(tender.id, validatedData.tenderId),
            eq(tender.organizationId, organizationId),
            isNull(tender.deletedAt)
          )
        )
        .limit(1);

      if (tenderExists.length === 0) {
        return { success: false, error: 'Tender not found' };
      }
    }

    const updatedProject = await db
      .update(project)
      .set({
        ...validatedData,
        projectNumber: validatedData.projectNumber
          ? validatedData.projectNumber.toUpperCase()
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId))
      .returning();

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error) {
    console.error('Error updating project:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: 'Failed to update project' };
  }
}

// Update project status
export async function updateProjectStatus(
  organizationId: string,
  projectId: string,
  data: ProjectStatusUpdateInput
) {
  try {
    // Validate input
    const validatedData = ProjectStatusUpdateSchema.parse(data);

    // Check if project exists and belongs to organization
    const existingProject = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (existingProject.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    const updatedProject = await db
      .update(project)
      .set({
        status: validatedData.status,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId))
      .returning();

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error) {
    console.error('Error updating project status:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: 'Failed to update project status' };
  }
}

// Soft delete project
export async function deleteProject(organizationId: string, projectId: string) {
  try {
    // Check if project exists and belongs to organization
    const existingProject = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (existingProject.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    // Check if project has active purchase orders before deletion
    const activePOs = await db
      .select({ id: purchaseOrder.id })
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.projectId, projectId),
          isNull(purchaseOrder.deletedAt)
        )
      )
      .limit(1);

    if (activePOs.length > 0) {
      return {
        success: false,
        error:
          'Cannot delete project with active purchase orders. Please delete the purchase orders first.',
      };
    }

    await db
      .update(project)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    revalidatePath('/dashboard/projects');
    return { success: true, message: 'Project deleted successfully' };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}

// Get project statistics for dashboard
export async function getProjectStats(organizationId: string) {
  try {
    // Get project stats
    const projectStats = await db
      .select({
        status: project.status,
        createdAt: project.createdAt,
      })
      .from(project)
      .where(
        and(
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      );

    const totalProjects = projectStats.length;
    const statusCounts = projectStats.reduce(
      (acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get PO stats
    const poStats = await db
      .select({
        status: purchaseOrder.status,
        totalAmount: purchaseOrder.totalAmount,
      })
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt)
        )
      );

    // Active POs: sent and delivered
    const activePOStatuses = ['sent', 'delivered'];
    const activePOs = poStats.filter((po) =>
      activePOStatuses.includes(po.status)
    ).length;

    // Total PO amount (only active POs)
    const totalPOAmount = poStats
      .filter((po) => activePOStatuses.includes(po.status))
      .reduce((sum, po) => {
        const amount = parseFloat(po.totalAmount || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Calculate growth (month-over-month project creation)
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const currentMonthProjects = projectStats.filter(
      (p) => p.createdAt >= currentMonth && p.createdAt < nextMonth
    ).length;

    const previousMonthProjects = projectStats.filter(
      (p) => p.createdAt >= previousMonth && p.createdAt < currentMonth
    ).length;

    let growth = 0;
    if (previousMonthProjects > 0) {
      growth =
        ((currentMonthProjects - previousMonthProjects) /
          previousMonthProjects) *
        100;
    } else if (currentMonthProjects > 0) {
      growth = 100; // If no previous month projects but current has some, show 100% growth
    }

    return {
      success: true,
      stats: {
        totalProjects,
        statusCounts: {
          active: statusCounts.active || 0,
          completed: statusCounts.completed || 0,
          cancelled: statusCounts.cancelled || 0,
        },
        activePOs,
        totalPOAmount,
        growth: Math.round(growth * 100) / 100, // Round to 2 decimal places
      },
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return {
      success: false,
      error: 'Failed to fetch project statistics',
      stats: {
        totalProjects: 0,
        statusCounts: {
          active: 0,
          completed: 0,
          cancelled: 0,
        },
        activePOs: 0,
        totalPOAmount: 0,
        growth: 0,
      },
    };
  }
}
