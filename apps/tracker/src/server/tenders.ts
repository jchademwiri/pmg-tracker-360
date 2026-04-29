'use server';

import { db } from '@pmg/db';
import { tender, client, project } from '@pmg/db/schema';
import { eq, and, isNull, ilike, or, desc, gte, lte, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  TenderCreateSchema,
  TenderUpdateSchema,
  TenderStatusUpdateSchema,
  TenderSearchSchema,
  type TenderCreateInput,
  type TenderUpdateInput,
  type TenderStatusUpdateInput,
  type TenderSearchInput,
} from '@/lib/validations/tender';

export async function getTenders(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  try {
    const offset = (page - 1) * limit;

    let whereCondition = and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt));

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(whereCondition, or(ilike(tender.tenderNumber, searchTerm), ilike(tender.description, searchTerm)));
    }

    if (status && status !== 'all') {
      whereCondition = and(whereCondition, eq(tender.status, status));
    }

    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: { id: client.id, name: client.name, contactName: client.contactName, contactEmail: client.contactEmail, contactPhone: client.contactPhone },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(whereCondition)
      .orderBy(desc(tender.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db.select({ count: tender.id }).from(tender).where(whereCondition);

    return { tenders, totalCount: totalCount.length, currentPage: page, totalPages: Math.ceil(totalCount.length / limit) };
  } catch (error) {
    console.error('Error fetching tenders:', error);
    throw new Error('Failed to fetch tenders');
  }
}

export async function createTender(organizationId: string, data: TenderCreateInput) {
  try {
    const validatedData = TenderCreateSchema.parse(data);

    const existingTender = await db
      .select()
      .from(tender)
      .where(and(eq(tender.tenderNumber, validatedData.tenderNumber.toUpperCase()), eq(tender.organizationId, organizationId), isNull(tender.deletedAt)))
      .limit(1);

    if (existingTender.length > 0) return { success: false, error: 'Tender number already exists in this organization' };

    const clientExists = await db
      .select()
      .from(client)
      .where(and(eq(client.id, validatedData.clientId), eq(client.organizationId, organizationId), isNull(client.deletedAt)))
      .limit(1);

    if (clientExists.length === 0) return { success: false, error: 'Client not found' };

    const newTender = await db
      .insert(tender)
      .values({ id: crypto.randomUUID(), organizationId, ...validatedData, tenderNumber: validatedData.tenderNumber.toUpperCase() })
      .returning();

    revalidatePath('/dashboard/tenders');
    return { success: true, tender: newTender[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.issues };
    return { success: false, error: 'Failed to create tender' };
  }
}

export async function getTenderById(organizationId: string, tenderId: string) {
  try {
    const tenderData = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: { id: client.id, name: client.name, contactName: client.contactName, contactEmail: client.contactEmail, contactPhone: client.contactPhone },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(and(eq(tender.id, tenderId), eq(tender.organizationId, organizationId), isNull(tender.deletedAt)))
      .limit(1);

    if (tenderData.length === 0) return { success: false, error: 'Tender not found' };
    return { success: true, tender: tenderData[0] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch tender' };
  }
}

export async function updateTender(organizationId: string, tenderId: string, data: TenderUpdateInput) {
  try {
    const validatedData = TenderUpdateSchema.parse(data);

    const existingTender = await db
      .select()
      .from(tender)
      .where(and(eq(tender.id, tenderId), eq(tender.organizationId, organizationId), isNull(tender.deletedAt)))
      .limit(1);

    if (existingTender.length === 0) return { success: false, error: 'Tender not found' };

    if (validatedData.tenderNumber) {
      const duplicate = await db
        .select()
        .from(tender)
        .where(and(eq(tender.tenderNumber, validatedData.tenderNumber.toUpperCase()), eq(tender.organizationId, organizationId), isNull(tender.deletedAt), ne(tender.id, tenderId)))
        .limit(1);
      if (duplicate.length > 0) return { success: false, error: 'Tender number already exists in this organization' };
    }

    if (validatedData.clientId) {
      const clientExists = await db.select().from(client).where(and(eq(client.id, validatedData.clientId), eq(client.organizationId, organizationId), isNull(client.deletedAt))).limit(1);
      if (clientExists.length === 0) return { success: false, error: 'Client not found' };
    }

    const updatedTender = await db
      .update(tender)
      .set({ ...validatedData, tenderNumber: validatedData.tenderNumber ? validatedData.tenderNumber.toUpperCase() : undefined, updatedAt: new Date() })
      .where(eq(tender.id, tenderId))
      .returning();

    revalidatePath('/dashboard/tenders');
    revalidatePath(`/dashboard/tenders/${tenderId}`);
    return { success: true, tender: updatedTender[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.issues };
    return { success: false, error: 'Failed to update tender' };
  }
}

export async function updateTenderStatus(organizationId: string, tenderId: string, data: TenderStatusUpdateInput) {
  try {
    const validatedData = TenderStatusUpdateSchema.parse(data);

    const existingTender = await db.select().from(tender).where(and(eq(tender.id, tenderId), eq(tender.organizationId, organizationId), isNull(tender.deletedAt))).limit(1);
    if (existingTender.length === 0) return { success: false, error: 'Tender not found' };

    const updatedTender = await db.update(tender).set({ status: validatedData.status, updatedAt: new Date() }).where(eq(tender.id, tenderId)).returning();

    revalidatePath('/dashboard/tenders');
    revalidatePath(`/dashboard/tenders/${tenderId}`);
    return { success: true, tender: updatedTender[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.issues };
    return { success: false, error: 'Failed to update tender status' };
  }
}

export async function deleteTender(organizationId: string, tenderId: string) {
  try {
    const existingTender = await db.select().from(tender).where(and(eq(tender.id, tenderId), eq(tender.organizationId, organizationId), isNull(tender.deletedAt))).limit(1);
    if (existingTender.length === 0) return { success: false, error: 'Tender not found' };

    const activeProjects = await db.select({ id: project.id }).from(project).where(and(eq(project.tenderId, tenderId), isNull(project.deletedAt))).limit(1);
    if (activeProjects.length > 0) return { success: false, error: 'Cannot delete tender with active projects. Please delete the projects first.' };

    await db.update(tender).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(tender.id, tenderId));

    revalidatePath('/dashboard/tenders');
    return { success: true, message: 'Tender deleted successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to delete tender' };
  }
}

export async function getTenderStats(organizationId: string) {
  try {
    const stats = await db
      .select({ status: tender.status, value: tender.value, submissionDate: tender.submissionDate, createdAt: tender.createdAt })
      .from(tender)
      .where(and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt)));

    const totalTenders = stats.length;
    const statusCounts = stats.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const totalValue = stats.reduce((sum, t) => { const v = parseFloat(t.value || '0'); return sum + (isNaN(v) ? 0 : v); }, 0);
    const winRate = totalTenders > 0 ? (statusCounts.won || 0) / totalTenders : 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = stats.filter(t => t.submissionDate && t.submissionDate > now && t.submissionDate <= thirtyDaysFromNow).length;
    const overdueCount = stats.filter(t => t.submissionDate && t.submissionDate < now).length;

    return {
      success: true,
      stats: {
        totalTenders,
        statusCounts: { draft: statusCounts.draft || 0, submitted: statusCounts.submitted || 0, won: statusCounts.won || 0, lost: statusCounts.lost || 0, pending: statusCounts.pending || 0 },
        totalValue,
        winRate,
        averageValue: totalTenders > 0 ? totalValue / totalTenders : 0,
        upcomingDeadlines,
        overdueCount,
      },
    };
  } catch (error) {
    return { success: false, error: 'Failed to fetch tender statistics', stats: { totalTenders: 0, statusCounts: { draft: 0, submitted: 0, won: 0, lost: 0, pending: 0 }, totalValue: 0, winRate: 0, averageValue: 0, upcomingDeadlines: 0, overdueCount: 0 } };
  }
}

export async function getUpcomingDeadlines(organizationId: string, limit: number = 10) {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingTenders = await db
      .select({ id: tender.id, tenderNumber: tender.tenderNumber, description: tender.description, submissionDate: tender.submissionDate, status: tender.status, value: tender.value, client: { name: client.name } })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt), gte(tender.submissionDate, now), lte(tender.submissionDate, thirtyDaysFromNow)))
      .orderBy(tender.submissionDate)
      .limit(limit);

    const tendersWithDays = upcomingTenders.map(t => ({
      ...t,
      daysUntilDeadline: t.submissionDate ? Math.ceil((t.submissionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
    }));

    return { success: true, deadlines: tendersWithDays };
  } catch (error) {
    return { success: false, error: 'Failed to fetch upcoming deadlines', deadlines: [] };
  }
}

// Aliases used by overview/submitted pages
export const getRecentActivity = async (organizationId: string, limit = 10) => {
  const result = await getTenders(organizationId, undefined, 1, limit);
  return {
    success: true,
    activity: {
      recentTenders: result.tenders,
      recentChanges: result.tenders,
    },
  };
};

export const getTendersOverview = async (
  organizationId: string,
  filters: { search?: string; status?: string; clientId?: string; sortBy?: string; sortOrder?: string } | string = {},
  page = 1,
  limit = 20
) => {
  const search = typeof filters === 'string' ? filters : filters.search;
  const status = typeof filters === 'string' ? undefined : filters.status;
  const result = await getTenders(organizationId, search, page, limit, status);
  return { success: true, ...result };
};

export const getTendersWithCustomSorting = async (
  organizationId: string,
  page = 1,
  limit = 10,
  search?: string
) => {
  const result = await getTenders(organizationId, search, page, limit);
  return { success: true, ...result };
};

export const getAvailableTendersForProjects = async (
  organizationId: string,
  _clientId?: string,
  page = 1,
  limit = 100
) => getTenders(organizationId, undefined, page, limit, 'won');
