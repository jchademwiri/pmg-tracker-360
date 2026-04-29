'use server';

import { db } from '@pmg/db';
import { project, client, tender, purchaseOrder } from '@pmg/db/schema';
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

export async function getProjects(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  try {
    const offset = (page - 1) * limit;

    let whereCondition = and(eq(project.organizationId, organizationId), isNull(project.deletedAt));

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(whereCondition, or(ilike(project.projectNumber, searchTerm), ilike(project.description, searchTerm)));
    }

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
        client: { id: client.id, name: client.name, contactName: client.contactName, contactEmail: client.contactEmail, contactPhone: client.contactPhone },
        tender: { id: tender.id, tenderNumber: tender.tenderNumber, description: tender.description },
      })
      .from(project)
      .leftJoin(client, eq(project.clientId, client.id))
      .leftJoin(tender, eq(project.tenderId, tender.id))
      .where(whereCondition)
      .orderBy(desc(project.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db.select({ count: project.id }).from(project).where(whereCondition);

    return { projects, totalCount: totalCount.length, currentPage: page, totalPages: Math.ceil(totalCount.length / limit) };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export async function createProject(organizationId: string, data: ProjectCreateInput) {
  try {
    const validatedData = ProjectCreateSchema.parse(data);

    const existingProject = await db
      .select()
      .from(project)
      .where(and(eq(project.projectNumber, validatedData.projectNumber.toUpperCase()), eq(project.organizationId, organizationId), isNull(project.deletedAt)))
      .limit(1);

    if (existingProject.length > 0) return { success: false, error: 'Project number already exists in this organization' };

    if (validatedData.clientId) {
      const clientExists = await db.select().from(client).where(and(eq(client.id, validatedData.clientId), eq(client.organizationId, organizationId), isNull(client.deletedAt))).limit(1);
      if (clientExists.length === 0) return { success: false, error: 'Client not found' };
    }

    if (validatedData.tenderId) {
      const tenderExists = await db.select().from(tender).where(and(eq(tender.id, validatedData.tenderId), eq(tender.organizationId, organizationId), isNull(tender.deletedAt))).limit(1);
      if (tenderExists.length === 0) return { success: false, error: 'Tender not found' };
    }

    const newProject = await db
      .insert(project)
      .values({ id: crypto.randomUUID(), organizationId, ...validatedData, projectNumber: validatedData.projectNumber.toUpperCase() })
      .returning();

    revalidatePath('/dashboard/projects');
    return { success: true, project: newProject[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.errors };
    return { success: false, error: 'Failed to create project' };
  }
}

export async function getProjectById(organizationId: string, projectId: string) {
  try {
    const projectData = await db
      .select({
        id: project.id,
        projectNumber: project.projectNumber,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: { id: client.id, name: client.name, contactName: client.contactName, contactEmail: client.contactEmail, contactPhone: client.contactPhone },
        tender: { id: tender.id, tenderNumber: tender.tenderNumber, description: tender.description, value: tender.value, submissionDate: tender.submissionDate },
      })
      .from(project)
      .leftJoin(client, eq(project.clientId, client.id))
      .leftJoin(tender, eq(project.tenderId, tender.id))
      .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId), isNull(project.deletedAt)))
      .limit(1);

    if (projectData.length === 0) return { success: false, error: 'Project not found' };
    return { success: true, project: projectData[0] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch project' };
  }
}

export async function updateProject(organizationId: string, projectId: string, data: ProjectUpdateInput) {
  try {
    const validatedData = ProjectUpdateSchema.parse(data);

    const existingProject = await db.select().from(project).where(and(eq(project.id, projectId), eq(project.organizationId, organizationId), isNull(project.deletedAt))).limit(1);
    if (existingProject.length === 0) return { success: false, error: 'Project not found' };

    if (validatedData.projectNumber) {
      const duplicate = await db.select().from(project).where(and(eq(project.projectNumber, validatedData.projectNumber.toUpperCase()), eq(project.organizationId, organizationId), isNull(project.deletedAt), ne(project.id, projectId))).limit(1);
      if (duplicate.length > 0) return { success: false, error: 'Project number already exists in this organization' };
    }

    const updatedProject = await db
      .update(project)
      .set({ ...validatedData, projectNumber: validatedData.projectNumber ? validatedData.projectNumber.toUpperCase() : undefined, updatedAt: new Date() })
      .where(eq(project.id, projectId))
      .returning();

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.errors };
    return { success: false, error: 'Failed to update project' };
  }
}

export async function updateProjectStatus(organizationId: string, projectId: string, data: ProjectStatusUpdateInput) {
  try {
    const validatedData = ProjectStatusUpdateSchema.parse(data);
    const existingProject = await db.select().from(project).where(and(eq(project.id, projectId), eq(project.organizationId, organizationId), isNull(project.deletedAt))).limit(1);
    if (existingProject.length === 0) return { success: false, error: 'Project not found' };

    const updatedProject = await db.update(project).set({ status: validatedData.status, updatedAt: new Date() }).where(eq(project.id, projectId)).returning();

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, project: updatedProject[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.errors };
    return { success: false, error: 'Failed to update project status' };
  }
}

export async function deleteProject(organizationId: string, projectId: string) {
  try {
    const existingProject = await db.select().from(project).where(and(eq(project.id, projectId), eq(project.organizationId, organizationId), isNull(project.deletedAt))).limit(1);
    if (existingProject.length === 0) return { success: false, error: 'Project not found' };

    const activePOs = await db.select({ id: purchaseOrder.id }).from(purchaseOrder).where(and(eq(purchaseOrder.projectId, projectId), isNull(purchaseOrder.deletedAt))).limit(1);
    if (activePOs.length > 0) return { success: false, error: 'Cannot delete project with active purchase orders. Please delete the purchase orders first.' };

    await db.update(project).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(project.id, projectId));

    revalidatePath('/dashboard/projects');
    return { success: true, message: 'Project deleted successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to delete project' };
  }
}

export async function getProjectStats(organizationId: string) {
  try {
    const projectStats = await db
      .select({ status: project.status, createdAt: project.createdAt })
      .from(project)
      .where(and(eq(project.organizationId, organizationId), isNull(project.deletedAt)));

    const totalProjects = projectStats.length;
    const statusCounts = projectStats.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>);

    const poStats = await db
      .select({ status: purchaseOrder.status, totalAmount: purchaseOrder.totalAmount })
      .from(purchaseOrder)
      .where(and(eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt)));

    const activePOStatuses = ['sent', 'delivered'];
    const activePOs = poStats.filter(po => activePOStatuses.includes(po.status)).length;
    const totalPOAmount = poStats.filter(po => activePOStatuses.includes(po.status)).reduce((sum, po) => { const a = parseFloat(po.totalAmount || '0'); return sum + (isNaN(a) ? 0 : a); }, 0);

    return {
      success: true,
      stats: {
        totalProjects,
        statusCounts: { active: statusCounts.active || 0, completed: statusCounts.completed || 0, cancelled: statusCounts.cancelled || 0 },
        activePOs,
        totalPOAmount,
        growth: 0,
      },
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch project statistics', stats: { totalProjects: 0, statusCounts: { active: 0, completed: 0, cancelled: 0 }, activePOs: 0, totalPOAmount: 0, growth: 0 } };
  }
}

// Alias used by overview page
export const getRecentProjectActivities = async (organizationId: string, limit = 10) => {
  const result = await getProjects(organizationId, undefined, 1, limit);
  return result.projects ?? [];
};
