'use server';

import { db } from '@pmg/db';
import {
  project,
  client,
  tender,
  purchaseOrder,
  purchaseOrderDeliveryNote,
  purchaseOrderDeliveryItem,
  organization,
  projectActivity,
  projectRisk,
  projectLineItem,
} from '@pmg/db/schema';
import { validateSessionAndOrg } from './utils';
import { eq, and, isNull, ilike, or, desc, ne, inArray, lt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  ProjectCreateSchema,
  ProjectUpdateSchema,
  ProjectStatusUpdateSchema,
  ProjectRiskSchema,
  ProjectCloseOutSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ProjectStatusUpdateInput,
  type ProjectRiskInput,
  type ProjectCloseOutInput,
} from '@/lib/validations/project';
import type { RecentActivity } from '@/types/activity';
import { nowInSAST } from '@/lib/timezone';

export async function getProjectBreadcrumbLabel(projectId: string) {
  try {
    const projectData = await db
      .select({ projectNumber: project.projectNumber })
      .from(project)
      .where(and(eq(project.id, projectId), isNull(project.deletedAt)))
      .limit(1);

    return projectData[0]?.projectNumber?.toUpperCase() || null;
  } catch (error) {
    console.error('Error fetching project breadcrumb label:', error);
    return null;
  }
}

// Get projects with pagination, search, and client joins
export async function getProjects(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  clientId?: string
) {
  try {
    await validateSessionAndOrg(organizationId);
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
      whereCondition = and(whereCondition, eq(project.status, status as any));
    }

    // Add client filter if provided
    if (clientId && clientId !== 'all') {
      whereCondition = and(whereCondition, eq(project.clientId, clientId));
    }

    const projectsData = await db.query.project.findMany({
      where: whereCondition,
      orderBy: [desc(project.createdAt)],
      limit,
      offset,
      with: {
        client: true,
        tender: true,
        purchaseOrders: {
          where: isNull(purchaseOrder.deletedAt),
          with: {
            deliveryNotes: {
              where: eq(purchaseOrderDeliveryNote.status, 'verified'),
              with: {
                items: true,
              },
            },
          },
        },
      },
    });

    const projects = projectsData.map((proj) => {
      const pos = proj.purchaseOrders || [];
      const totalPOAmount = pos.reduce((sum, po) => sum + parseFloat(po.totalAmount || '0'), 0);

      // Calculate actual delivered value from verified delivery items
      let totalDelivered = 0;
      for (const po of pos) {
        if (po.status === 'completed' || po.status === 'delivered') {
          // Full amount delivered
          totalDelivered += parseFloat(po.totalAmount || '0');
        } else {
          // Sum actual delivery item values for partially_delivered and other statuses
          for (const note of po.deliveryNotes || []) {
            for (const item of (note as any).items || []) {
              totalDelivered += parseFloat(item.deliveryValue || '0');
            }
          }
        }
      }

      const completionPercentage = totalPOAmount > 0
        ? Math.round((totalDelivered / totalPOAmount) * 100)
        : 0;

      return {
        ...proj,
        completionPercentage,
      };
    });

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
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

// Create a new project
export async function createProject(
  organizationId: string,
  data: ProjectCreateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = ProjectCreateSchema.parse(data);

    // Check if project number is unique within organization
    const existingProject = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.projectNumber, validatedData.projectNumber.toLowerCase()),
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
        projectNumber: validatedData.projectNumber.toLowerCase(),
      })
      .returning();

    revalidatePath('/projects');
    return { success: true, project: newProject[0] };
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to create project' };
  }
}

// Get project by ID with client and tender information
export async function getProjectById(
  organizationId: string,
  projectId: string
) {
  try {
    await validateSessionAndOrg(organizationId);
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
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return { success: false, error: error.message || 'Failed to fetch project' };
  }
}

// Get recent project and PO activities for an organization
export async function getRecentProjectActivities(
  organizationId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  try {
    await validateSessionAndOrg(organizationId);
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
        description: `Project ${proj.projectNumber.toUpperCase()} was created${proj.client?.name ? ` for ${proj.client.name}` : ''}`,
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
          description: `Project ${proj.projectNumber.toUpperCase()} status changed to ${proj.status}`,
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
  } catch (error: any) {
    console.error('Error fetching recent project activities:', error);
    throw error;
  }
}

// Update project
export async function updateProject(
  organizationId: string,
  projectId: string,
  data: ProjectUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
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
              validatedData.projectNumber.toLowerCase()
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
          ? validatedData.projectNumber.toLowerCase()
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId))
      .returning();

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error: any) {
    console.error('Error updating project:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update project' };
  }
}

// Update project status
export async function updateProjectStatus(
  organizationId: string,
  projectId: string,
  data: ProjectStatusUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
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

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error: any) {
    console.error('Error updating project status:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update project status' };
  }
}

// Soft delete project
export async function deleteProject(organizationId: string, projectId: string) {
  try {
    await validateSessionAndOrg(organizationId);
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

    revalidatePath('/projects');
    return { success: true, message: 'Project deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}

// Get project statistics for dashboard
export async function getProjectStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    // Get all projects with risks and POs
    const allProjects = await db.query.project.findMany({
      where: and(
        eq(project.organizationId, organizationId),
        isNull(project.deletedAt)
      ),
      with: {
        risks: {
          where: eq(projectRisk.status, 'open'),
        },
        purchaseOrders: {
          where: isNull(purchaseOrder.deletedAt),
        }
      }
    });

    const totalProjects = allProjects.length;
    const statusCounts = allProjects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      { active: 0, completed: 0, cancelled: 0 } as Record<string, number>
    );

    // Calculate Project Health (active projects only)
    const healthStats = {
      onTrack: 0,
      delayed: 0,
      critical: 0,
    };

    const now = nowInSAST();

    for (const p of allProjects) {
      if (p.status !== 'active') continue;

      const hasCriticalRisk = p.risks.some(r => ['high', 'critical'].includes(r.severity));
      const hasOverdueDelivery = p.purchaseOrders.some(po => 
        ['open', 'sent', 'partially_delivered'].includes(po.status) &&
        po.expectedDeliveryDate &&
        po.expectedDeliveryDate < now
      );

      if (hasCriticalRisk) {
        healthStats.critical++;
      } else if (hasOverdueDelivery) {
        healthStats.delayed++;
      } else {
        healthStats.onTrack++;
      }
    }

    // Get active PO stats
    const activePOStatuses = ['open', 'sent', 'partially_delivered', 'delivered'];
    const allPOs = allProjects.flatMap(p => p.purchaseOrders);
    
    const deliveryStats = {
      totalPOs: allPOs.length,
      pendingDeliveries: allPOs.filter(po => ['open', 'sent'].includes(po.status)).length,
      partialDeliveries: allPOs.filter(po => po.status === 'partially_delivered').length,
      fullyDelivered: allPOs.filter(po => po.status === 'delivered').length,
    };

    // Calculate total active PO amount
    const totalPOAmount = allPOs
      .filter((po) => activePOStatuses.includes(po.status))
      .reduce((sum, po) => {
        const amount = parseFloat(po.totalAmount || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Get total contract award value for active projects
    const totalAwardValue = allProjects
      .filter(p => p.status === 'active')
      .reduce((sum, p) => {
        const val = parseFloat(p.awardValue || '0');
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

    // Get total delivered financial value from verified deliveries
    const deliveryValueResult = await db
      .select({
        totalDelivered: sql<string>`coalesce(sum(${purchaseOrderDeliveryItem.deliveryValue}), '0')`,
      })
      .from(purchaseOrderDeliveryItem)
      .innerJoin(purchaseOrderDeliveryNote, eq(purchaseOrderDeliveryItem.deliveryNoteId, purchaseOrderDeliveryNote.id))
      .innerJoin(project, eq(purchaseOrderDeliveryNote.projectId, project.id))
      .where(
        and(
          eq(project.organizationId, organizationId),
          eq(purchaseOrderDeliveryNote.status, 'verified')
        )
      );
    const totalDeliveredValue = parseFloat(deliveryValueResult[0]?.totalDelivered || '0');

    // Risk stats
    const allActiveRisks = allProjects.flatMap(p => p.risks);
    const riskStats = {
      totalActiveRisks: allActiveRisks.length,
      highCriticalRisks: allActiveRisks.filter(r => ['high', 'critical'].includes(r.severity)).length,
    };

    // Calculate growth (month-over-month active project creation)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const currentMonthProjects = allProjects.filter(
      (p) => p.createdAt >= currentMonth && p.createdAt < nextMonth
    ).length;

    const previousMonthProjects = allProjects.filter(
      (p) => p.createdAt >= previousMonth && p.createdAt < currentMonth
    ).length;

    let growth = 0;
    if (previousMonthProjects > 0) {
      growth = ((currentMonthProjects - previousMonthProjects) / previousMonthProjects) * 100;
    } else if (currentMonthProjects > 0) {
      growth = 100;
    }

    return {
      success: true,
      stats: {
        totalProjects,
        statusCounts,
        healthStats,
        deliveryStats,
        riskStats,
        financialStats: {
          totalAwardValue,
          totalPOValue: totalPOAmount,
          totalDeliveredValue,
          remainingValue: Math.max(0, totalPOAmount - totalDeliveredValue),
        },
        growth: Math.round(growth * 100) / 100,
      },
    };
  } catch (error: any) {
    console.error('Error fetching project stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch project statistics',
      stats: {
        totalProjects: 0,
        statusCounts: { active: 0, completed: 0, cancelled: 0 },
        healthStats: { onTrack: 0, delayed: 0, critical: 0 },
        deliveryStats: { totalPOs: 0, pendingDeliveries: 0, partialDeliveries: 0, fullyDelivered: 0 },
        riskStats: { totalActiveRisks: 0, highCriticalRisks: 0 },
        financialStats: { totalAwardValue: 0, totalPOValue: 0, totalDeliveredValue: 0, remainingValue: 0 },
        growth: 0,
      },
    };
  }
}

// Log project activity helper
export async function logProjectActivity(
  organizationId: string,
  projectId: string,
  activityType: string,
  description: string,
  userId?: string
) {
  try {
    await db.insert(projectActivity).values({
      id: crypto.randomUUID(),
      organizationId,
      projectId,
      activityType,
      description,
      userId: userId || null,
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging project activity:', error);
    return { success: false, error };
  }
}

// Get activities for a specific project
export async function getProjectActivities(
  organizationId: string,
  projectId: string
) {
  try {
    await validateSessionAndOrg(organizationId);

    const activities = await db.query.projectActivity.findMany({
      where: and(
        eq(projectActivity.projectId, projectId),
        eq(projectActivity.organizationId, organizationId)
      ),
      orderBy: [desc(projectActivity.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, activities };
  } catch (error: any) {
    console.error('Error fetching project activities:', error);
    return { success: false, error: error.message || 'Failed to fetch project activities' };
  }
}

// Add a project risk
export async function addProjectRisk(
  organizationId: string,
  projectId: string,
  data: ProjectRiskInput
) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);
    const validatedData = ProjectRiskSchema.parse(data);

    // Verify project exists
    const proj = await db
      .select({ id: project.id, projectNumber: project.projectNumber })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)))
      .limit(1);

    if (proj.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    const newRisk = await db
      .insert(projectRisk)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        projectId,
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        mitigationPlan: validatedData.mitigationPlan || null,
        status: 'open',
      })
      .returning();

    // Log activity
    await logProjectActivity(
      organizationId,
      projectId,
      'risk_recorded',
      `Risk logged: "${validatedData.title}" (${validatedData.severity} severity)`,
      userId
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true, risk: newRisk[0] };
  } catch (error: any) {
    console.error('Error adding project risk:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: error.message || 'Failed to add project risk' };
  }
}

// Get risks for a specific project
export async function getProjectRisks(
  organizationId: string,
  projectId: string
) {
  try {
    await validateSessionAndOrg(organizationId);

    const risks = await db.query.projectRisk.findMany({
      where: and(
        eq(projectRisk.projectId, projectId),
        eq(projectRisk.organizationId, organizationId)
      ),
      orderBy: [desc(projectRisk.createdAt)],
    });

    return { success: true, risks };
  } catch (error: any) {
    console.error('Error fetching project risks:', error);
    return { success: false, error: error.message || 'Failed to fetch project risks' };
  }
}

// Update project risk status/mitigation
export async function updateProjectRiskStatus(
  organizationId: string,
  projectId: string,
  riskId: string,
  status: 'open' | 'mitigated' | 'closed',
  mitigationPlan?: string
) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);

    // Verify risk exists
    const riskData = await db
      .select()
      .from(projectRisk)
      .where(and(eq(projectRisk.id, riskId), eq(projectRisk.projectId, projectId)))
      .limit(1);

    if (riskData.length === 0) {
      return { success: false, error: 'Risk not found' };
    }

    const updatedRisk = await db
      .update(projectRisk)
      .set({
        status,
        mitigationPlan: mitigationPlan !== undefined ? mitigationPlan : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projectRisk.id, riskId))
      .returning();

    // Log activity
    await logProjectActivity(
      organizationId,
      projectId,
      'risk_recorded',
      `Risk "${riskData[0].title}" status updated to ${status}`,
      userId
    );

    revalidatePath(`/projects/${projectId}`);
    return { success: true, risk: updatedRisk[0] };
  } catch (error: any) {
    console.error('Error updating project risk:', error);
    return { success: false, error: error.message || 'Failed to update project risk' };
  }
}

// Submit project close-out
export async function submitProjectCloseOut(
  organizationId: string,
  projectId: string,
  data: ProjectCloseOutInput
) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);
    const validatedData = ProjectCloseOutSchema.parse(data);

    // Verify project exists
    const proj = await db
      .select({ id: project.id, projectNumber: project.projectNumber })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)))
      .limit(1);

    if (proj.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    const updatedProject = await db
      .update(project)
      .set({
        status: 'completed',
        closeOutDate: new Date(),
        closeOutNotes: validatedData.closeOutNotes,
        closeOutSubmittedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId))
      .returning();

    // Log activity
    await logProjectActivity(
      organizationId,
      projectId,
      'close_out',
      `Project closed out. Notes: "${validatedData.closeOutNotes.slice(0, 60)}${validatedData.closeOutNotes.length > 60 ? '...' : ''}"`,
      userId
    );

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error: any) {
    console.error('Error closing out project:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: error.message || 'Failed to close out project' };
  }
}

// Get project details, POs, activities, risks, and documents for the workspace
export async function getProjectWorkspaceData(
  organizationId: string,
  projectId: string
) {
  try {
    await validateSessionAndOrg(organizationId);

    const projectData = await db.query.project.findFirst({
      where: and(
        eq(project.id, projectId),
        eq(project.organizationId, organizationId),
        isNull(project.deletedAt)
      ),
      with: {
        client: true,
        tender: true,
        purchaseOrders: {
          where: isNull(purchaseOrder.deletedAt),
          with: {
            lineItems: true,
            deliveryNotes: {
              orderBy: [desc(purchaseOrderDeliveryNote.receivedAt)],
              with: {
                items: true,
              },
            },
          },
        },
        lineItems: {
          where: isNull(projectLineItem.deletedAt),
          orderBy: [desc(projectLineItem.updatedAt)],
        },
        activities: {
          orderBy: [desc(projectActivity.createdAt)],
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        risks: {
          orderBy: [desc(projectRisk.createdAt)],
        },
        documents: {
          with: {
            uploader: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!projectData) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, project: projectData };
  } catch (error: any) {
    console.error('Error fetching project workspace data:', error);
    return { success: false, error: error.message || 'Failed to fetch project workspace data' };
  }
}

// Get action queue lists and aggregates for projects
export async function getProjectActionQueue(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const now = nowInSAST();

    // 1. Overdue Deliveries: POs with status open, sent, or partially_delivered and expectedDeliveryDate in the past.
    const overdueDeliveries = await db
      .select({
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        description: purchaseOrder.description,
        totalAmount: purchaseOrder.totalAmount,
        status: purchaseOrder.status,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        project: {
          id: project.id,
          projectNumber: project.projectNumber,
        },
        client: {
          name: client.name,
        }
      })
      .from(purchaseOrder)
      .innerJoin(project, eq(purchaseOrder.projectId, project.id))
      .leftJoin(client, eq(project.clientId, client.id))
      .where(
        and(
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt),
          inArray(purchaseOrder.status, ['open', 'sent', 'partially_delivered'] as const),
          lt(purchaseOrder.expectedDeliveryDate, now)
        )
      )
      .orderBy(purchaseOrder.expectedDeliveryDate);

    // 2. Partial Deliveries: POs with status partially_delivered
    const partialDeliveries = await db
      .select({
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        description: purchaseOrder.description,
        totalAmount: purchaseOrder.totalAmount,
        status: purchaseOrder.status,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        project: {
          id: project.id,
          projectNumber: project.projectNumber,
        },
        client: {
          name: client.name,
        }
      })
      .from(purchaseOrder)
      .innerJoin(project, eq(purchaseOrder.projectId, project.id))
      .leftJoin(client, eq(project.clientId, client.id))
      .where(
        and(
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt),
          eq(purchaseOrder.status, 'partially_delivered')
        )
      )
      .orderBy(desc(purchaseOrder.createdAt));

    // 3. High Risks: Active risks (status = 'open') with severity high or critical
    const highRisks = await db
      .select({
        id: projectRisk.id,
        title: projectRisk.title,
        description: projectRisk.description,
        severity: projectRisk.severity,
        status: projectRisk.status,
        createdAt: projectRisk.createdAt,
        project: {
          id: project.id,
          projectNumber: project.projectNumber,
        }
      })
      .from(projectRisk)
      .innerJoin(project, eq(projectRisk.projectId, project.id))
      .where(
        and(
          eq(projectRisk.organizationId, organizationId),
          eq(projectRisk.status, 'open'),
          inArray(projectRisk.severity, ['high', 'critical'])
        )
      )
      .orderBy(desc(projectRisk.createdAt));

    // 4. Close-out Candidates: Active projects whose contract end date is in the past, or where all POs are fully delivered.
    const activeProjects = await db.query.project.findMany({
      where: and(
        eq(project.organizationId, organizationId),
        eq(project.status, 'active'),
        isNull(project.deletedAt)
      ),
      with: {
        client: true,
        purchaseOrders: {
          where: isNull(purchaseOrder.deletedAt),
        }
      }
    });

    const closeOutCandidates = activeProjects
      .filter(p => {
        const isPastEndDate = p.contractEndDate && p.contractEndDate < now;
        const allPOsDelivered = p.purchaseOrders.length > 0 && p.purchaseOrders.every(po => po.status === 'delivered');
        return isPastEndDate || allPOsDelivered;
      })
      .map(p => ({
        id: p.id,
        projectNumber: p.projectNumber,
        description: p.description,
        contractEndDate: p.contractEndDate,
        status: p.status,
        client: p.client ? { name: p.client.name } : null,
        candidateReason: (p.contractEndDate && p.contractEndDate < now) ? 'Passed End Date' : 'All POs Delivered',
      }));

    return {
      success: true,
      queues: {
        overdueDeliveries,
        partialDeliveries,
        highRisks,
        closeOutCandidates,
      }
    };
  } catch (error: any) {
    console.error('Error fetching project action queues:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch project action queues',
      queues: {
        overdueDeliveries: [],
        partialDeliveries: [],
        highRisks: [],
        closeOutCandidates: [],
      }
    };
  }
}

// Lightweight helper returning { id, projectNumber }[] for search filters
export async function getProjectsList(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const result = await db
      .select({ id: project.id, projectNumber: project.projectNumber })
      .from(project)
      .where(
        and(
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .orderBy(project.projectNumber);
    return { success: true, projects: result };
  } catch (error: any) {
    console.error('Error getting projects list:', error);
    return { success: false, projects: [], error: error.message };
  }
}
