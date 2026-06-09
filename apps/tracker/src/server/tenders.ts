'use server';

import { db } from '@pmg/db';
import { validateSessionAndOrg } from './utils';
import { tender, client, project, tenderExtension } from '@pmg/db/schema';
import { eq, and, isNull, ilike, or, desc, gte, lte, ne, lt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TenderCreateSchema, TenderUpdateSchema, TenderStatusUpdateSchema, TenderSearchSchema, type TenderCreateInput, type TenderUpdateInput, type TenderStatusUpdateInput, type TenderSearchInput } from '@/lib/validations/tender';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nowInSAST } from '@/lib/timezone';

/**
 * Automatically creates a project record in the database for an awarded tender.
 * Returns the created or existing project ID.
 */
async function autoCreateProjectForTender(
  organizationId: string,
  tenderId: string,
  tenderData: {
    tenderNumber: string;
    description?: string | null;
    clientId: string;
    awardValue?: string | null;
    contractStartDate?: Date | null;
    contractEndDate?: Date | null;
    signedContractUrl?: string | null;
  }
) {
  try {
    // Check if project already exists for this tender
    const existingProj = await db
      .select()
      .from(project)
      .where(and(eq(project.tenderId, tenderId), isNull(project.deletedAt)))
      .limit(1);

    if (existingProj.length > 0) {
      return existingProj[0].id;
    }

    const projectId = randomUUID();
    await db.insert(project).values({
      id: projectId,
      organizationId,
      projectNumber: tenderData.tenderNumber.toUpperCase(),
      description: tenderData.description || `Project for Tender ${tenderData.tenderNumber}`,
      tenderId,
      clientId: tenderData.clientId,
      status: 'active',
      contractStartDate: tenderData.contractStartDate,
      contractEndDate: tenderData.contractEndDate,
      awardValue: tenderData.awardValue,
      signedContractUrl: tenderData.signedContractUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/projects');
    return projectId;
  } catch (err) {
    console.error('Failed to auto create project for tender:', err);
    return undefined;
  }
}

async function resolveEvaluationDate(
  tenderId: string | undefined,
  submissionDate: Date | null | undefined,
  validityDays: number | null | undefined,
  validityDate: Date | null | undefined
): Promise<Date | null> {
  if (tenderId) {
    const latestExtension = await db
      .select()
      .from(tenderExtension)
      .where(and(eq(tenderExtension.tenderId, tenderId), isNull(tenderExtension.deletedAt)))
      .orderBy(desc(tenderExtension.newEvaluationDate))
      .limit(1);

    if (latestExtension.length > 0) {
      return latestExtension[0].newEvaluationDate;
    }
  }

  if (validityDate) {
    return new Date(validityDate);
  }
  if (submissionDate && validityDays) {
    const calcDate = new Date(submissionDate);
    calcDate.setDate(calcDate.getDate() + validityDays);
    return calcDate;
  }
  return null;
}

// Get tenders with pagination, search, and client joins
export async function getTenders(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt)
    );

    // Add search condition if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(tender.tenderNumber, searchTerm),
          ilike(tender.description, searchTerm)
        )
      );
    }

    // Add status filter if provided
    if (status === 'submitted-pending') {
      whereCondition = and(
        whereCondition,
        or(eq(tender.status, 'evaluation'), eq(tender.status, 'closed'))
      );
    } else if (status && status !== 'all') {
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
        evaluationDate: tender.evaluationDate,
        validityDays: tender.validityDays,
        validityDate: tender.validityDate,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(whereCondition)
      .orderBy(desc(tender.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: tender.id })
      .from(tender)
      .where(whereCondition);

    return {
      tenders,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error fetching tenders:', error);
    throw error;
  }
}



// Create a new tender with tender number validation
export async function createTender(
  organizationId: string,
  data: TenderCreateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = TenderCreateSchema.parse(data);

    // Check if tender number is unique within organization
    const existingTender = await db
      .select()
      .from(tender)
      .where(
        and(
          eq(tender.tenderNumber, validatedData.tenderNumber.toUpperCase()),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .limit(1);

    if (existingTender.length > 0) {
      return {
        success: false,
        error: 'Tender number already exists in this organization',
      };
    }

    // Verify client exists and belongs to organization
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

    if (validatedData.status === 'awarded') {
      const existingProj = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.projectNumber, validatedData.tenderNumber.toUpperCase()),
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt)
          )
        )
        .limit(1);

      if (existingProj.length > 0) {
        return {
          success: false,
          error: `Project ${validatedData.tenderNumber.toUpperCase()} already exists. This tender may have already been converted to a project.`,
        };
      }
    }

    const evaluationDate = await resolveEvaluationDate(
      undefined,
      validatedData.submissionDate,
      validatedData.validityDays,
      validatedData.validityDate
    );

    const newTender = await db
      .insert(tender)
      .values({
        id: randomUUID(),
        organizationId,
        ...validatedData,
        evaluationDate,
        tenderNumber: validatedData.tenderNumber.toUpperCase(),
      })
      .returning();

    let projectId: string | undefined;
    if (validatedData.status === 'awarded') {
      projectId = await autoCreateProjectForTender(organizationId, newTender[0].id, newTender[0]);
    }

    revalidatePath('/tenders');
    return { success: true, tender: newTender[0], projectId };
  } catch (error: any) {
    console.error('Error creating tender:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to create tender' };
  }
}

// Get tender by ID with client information
export async function getTenderById(organizationId: string, tenderId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const tenderData = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        evaluationDate: tender.evaluationDate,
        validityDays: tender.validityDays,
        validityDate: tender.validityDate,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.id, tenderId),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .limit(1);

    return { success: true, tender: tenderData[0] };
  } catch (error: any) {
    console.error('Error fetching tender:', error);
    return { success: false, error: error.message || 'Failed to fetch tender' };
  }
}

export async function getTenderBreadcrumbLabel(tenderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const organizationId = session?.session.activeOrganizationId;

    if (!session?.user || !organizationId) {
      return null;
    }

    await validateSessionAndOrg(organizationId);

    const tenderData = await db
      .select({
        tenderNumber: tender.tenderNumber,
      })
      .from(tender)
      .where(
        and(
          eq(tender.id, tenderId),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .limit(1);

    return tenderData[0]?.tenderNumber ?? null;
  } catch (error) {
    console.error('Error fetching tender breadcrumb label:', error);
    return null;
  }
}

// Update tender
export async function updateTender(
  organizationId: string,
  tenderId: string,
  data: TenderUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = TenderUpdateSchema.parse(data);

    // Check if tender exists and belongs to organization
    const existingTender = await db
      .select()
      .from(tender)
      .where(
        and(
          eq(tender.id, tenderId),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .limit(1);

    if (existingTender.length === 0) {
      return { success: false, error: 'Tender not found' };
    }

    // If tender number is being updated, check uniqueness
    if (validatedData.tenderNumber) {
      const duplicateTender = await db
        .select()
        .from(tender)
        .where(
          and(
            eq(tender.tenderNumber, validatedData.tenderNumber.toUpperCase()),
            eq(tender.organizationId, organizationId),
            isNull(tender.deletedAt),
            // Exclude current tender from uniqueness check
            ne(tender.id, tenderId)
          )
        )
        .limit(1);

      if (duplicateTender.length > 0) {
        return {
          success: false,
          error: 'Tender number already exists in this organization',
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

    if (validatedData.status === 'awarded') {
      const tenderNum = validatedData.tenderNumber || existingTender[0].tenderNumber;
      const existingProj = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.projectNumber, tenderNum.toUpperCase()),
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt)
          )
        )
        .limit(1);

      if (existingProj.length > 0) {
        return {
          success: false,
          error: `Project ${tenderNum.toUpperCase()} already exists. This tender may have already been converted to a project.`,
        };
      }
    }

    const mergedSubmissionDate = validatedData.hasOwnProperty('submissionDate')
      ? validatedData.submissionDate
      : existingTender[0].submissionDate;

    const mergedValidityDays = validatedData.hasOwnProperty('validityDays')
      ? validatedData.validityDays
      : existingTender[0].validityDays;

    const mergedValidityDate = validatedData.hasOwnProperty('validityDate')
      ? validatedData.validityDate
      : existingTender[0].validityDate;

    const evaluationDate = await resolveEvaluationDate(
      tenderId,
      mergedSubmissionDate,
      mergedValidityDays,
      mergedValidityDate
    );

    const updatedTender = await db
      .update(tender)
      .set({
        ...validatedData,
        evaluationDate,
        tenderNumber: validatedData.tenderNumber
          ? validatedData.tenderNumber.toUpperCase()
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tender.id, tenderId))
      .returning();

    let projectId: string | undefined;
    if (validatedData.status === 'awarded') {
      projectId = await autoCreateProjectForTender(organizationId, tenderId, {
        tenderNumber: updatedTender[0].tenderNumber,
        description: updatedTender[0].description,
        clientId: updatedTender[0].clientId,
      });
    }

    revalidatePath('/tenders');
    revalidatePath(`/tenders/${tenderId}`);
    return { success: true, tender: updatedTender[0], projectId };
  } catch (error: any) {
    console.error('Error updating tender:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update tender' };
  }
}

// Update tender status
export async function updateTenderStatus(
  organizationId: string,
  tenderId: string,
  data: TenderStatusUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = TenderStatusUpdateSchema.parse(data);

    // Check if tender exists and belongs to organization
    const existingTender = await db
      .select()
      .from(tender)
      .where(
        and(
          eq(tender.id, tenderId),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .limit(1);

    if (existingTender.length === 0) {
      return { success: false, error: 'Tender not found' };
    }

    if (validatedData.status === 'awarded') {
      const existingProj = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.projectNumber, existingTender[0].tenderNumber.toUpperCase()),
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt)
          )
        )
        .limit(1);

      if (existingProj.length > 0) {
        return {
          success: false,
          error: `Project ${existingTender[0].tenderNumber.toUpperCase()} already exists. This tender may have already been converted to a project.`,
        };
      }
    }

    const updatedTender = await db
      .update(tender)
      .set({
        status: validatedData.status,
        updatedAt: new Date(),
      })
      .where(eq(tender.id, tenderId))
      .returning();

    let projectId: string | undefined;
    if (validatedData.status === 'awarded') {
      projectId = await autoCreateProjectForTender(organizationId, tenderId, {
        tenderNumber: existingTender[0].tenderNumber,
        description: existingTender[0].description,
        clientId: existingTender[0].clientId,
        awardValue: validatedData.awardValue ?? existingTender[0].value,
        contractStartDate: validatedData.contractStartDate,
        contractEndDate: validatedData.contractEndDate,
        signedContractUrl: validatedData.signedContractUrl,
      });
    }

    revalidatePath('/tenders');
    revalidatePath(`/tenders/${tenderId}`);
    return { success: true, tender: updatedTender[0], projectId };
  } catch (error: any) {
    console.error('Error updating tender status:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update tender status' };
  }
}

// Soft delete tender
export async function deleteTender(organizationId: string, tenderId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    // Check if tender exists and belongs to organization
    const existingTender = await db
      .select()
      .from(tender)
      .where(
        and(
          eq(tender.id, tenderId),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .limit(1);

    if (existingTender.length === 0) {
      return { success: false, error: 'Tender not found' };
    }

    // Check if tender has active projects before deletion
    const activeProjects = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.tenderId, tenderId), isNull(project.deletedAt)))
      .limit(1);

    if (activeProjects.length > 0) {
      return {
        success: false,
        error:
          'Cannot delete tender with active projects. Please delete the projects first.',
      };
    }

    await db
      .update(tender)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tender.id, tenderId));

    revalidatePath('/tenders');
    return { success: true, message: 'Tender deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting tender:', error);
    return { success: false, error: error.message || 'Failed to delete tender' };
  }
}

// Search tenders with advanced filtering
export async function searchTenders(
  organizationId: string,
  searchParams: TenderSearchInput,
  page: number = 1,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;
    const validatedParams = TenderSearchSchema.parse(searchParams);

    let whereCondition = and(
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt)
    );

    // Add search query condition
    if (validatedParams.query && validatedParams.query.trim()) {
      const searchTerm = `%${validatedParams.query.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(tender.tenderNumber, searchTerm),
          ilike(tender.description, searchTerm)
        )
      );
    }

    // Add status filter
    if (validatedParams.status) {
      whereCondition = and(
        whereCondition,
        eq(tender.status, validatedParams.status)
      );
    }

    // Add client filter
    if (validatedParams.clientId) {
      whereCondition = and(
        whereCondition,
        eq(tender.clientId, validatedParams.clientId)
      );
    }

    // Add date range filters
    if (validatedParams.dateFrom) {
      whereCondition = and(
        whereCondition,
        gte(tender.submissionDate, validatedParams.dateFrom)
      );
    }

    if (validatedParams.dateTo) {
      whereCondition = and(
        whereCondition,
        lte(tender.submissionDate, validatedParams.dateTo)
      );
    }

    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(whereCondition)
      .orderBy(desc(tender.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: tender.id })
      .from(tender)
      .where(whereCondition);

    return {
      success: true,
      tenders,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error searching tenders:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
        tenders: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to search tenders',
      tenders: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
    };
  }
}

// Get tenders with sorting options
export async function getTendersWithSorting(
  organizationId: string,
  sortBy:
    | 'tenderNumber'
    | 'createdAt'
    | 'submissionDate'
    | 'status' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  page: number = 1,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    const whereCondition = and(
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt)
    );

    // Determine sort column
    let sortColumn;
    switch (sortBy) {
      case 'tenderNumber':
        sortColumn = tender.tenderNumber;
        break;
      case 'submissionDate':
        sortColumn = tender.submissionDate;
        break;
      case 'status':
        sortColumn = tender.status;
        break;
      default:
        sortColumn = tender.createdAt;
    }

    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        evaluationDate: tender.evaluationDate,
        validityDays: tender.validityDays,
        validityDate: tender.validityDate,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(whereCondition)
      .orderBy(desc(tender.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: tender.id })
      .from(tender)
      .where(whereCondition);

    return {
      success: true,
      tenders,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error fetching tenders with sorting:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch tenders',
      tenders: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
    };
  }
}

// Get tenders available for project creation (won status, not linked to projects)
export async function getAvailableTendersForProjects(
  organizationId: string,
  clientId?: string,
  page: number = 1,
  limit: number = 100
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt),
      eq(tender.status, 'won'),
      // Exclude tenders that are already linked to projects
      isNull(project.tenderId)
    );

    // Add client filter if provided
    if (clientId) {
      whereCondition = and(whereCondition, eq(tender.clientId, clientId));
    }

    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .leftJoin(project, eq(tender.id, project.tenderId))
      .where(whereCondition)
      .orderBy(desc(tender.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: tender.id })
      .from(tender)
      .leftJoin(project, eq(tender.id, project.tenderId))
      .where(whereCondition);

    return {
      tenders,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error fetching available tenders for projects:', error);
    throw error;
  }
}

// Get tender statistics for dashboard
export async function getTenderStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const stats = await db
      .select({
        status: tender.status,
        value: tender.value,
        submissionDate: tender.submissionDate,
        createdAt: tender.createdAt,
      })
      .from(tender)
      .where(
        and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt))
      );

    const totalTenders = stats.length;
    const statusCounts = stats.reduce(
      (acc, tender) => {
        acc[tender.status] = (acc[tender.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate total value (only for tenders with numeric values)
    const totalValue = stats.reduce((sum, tender) => {
      const value = parseFloat(tender.value || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    // Calculate win rate using 'awarded'
    const winRate =
      totalTenders > 0 ? (statusCounts.awarded || 0) / totalTenders : 0;

    // Calculate average value
    const averageValue = totalTenders > 0 ? totalValue / totalTenders : 0;

    // Count upcoming deadlines (next 30 days)
    const now = nowInSAST();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const upcomingDeadlines = stats.filter(
      (tender) =>
        tender.submissionDate &&
        tender.submissionDate > now &&
        tender.submissionDate <= thirtyDaysFromNow
    ).length;

    // Calculate overdue tenders
    const overdueCount = stats.filter(
      (tender) => tender.submissionDate && tender.submissionDate < now
    ).length;

    // --- Trend Calculation (vs 30 days ago) ---
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter stats to represent the state 30 days ago
    const previousStats = stats.filter(
      (t) => t.createdAt && t.createdAt < thirtyDaysAgo
    );

    const previousTotalTenders = previousStats.length;

    // Status counts for previous period
    const previousStatusCounts = previousStats.reduce(
      (acc, tender) => {
        acc[tender.status] = (acc[tender.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Previous Total Value
    const previousTotalValue = previousStats.reduce((sum, tender) => {
      const value = parseFloat(tender.value || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    // Previous Win Rate using 'awarded'
    const previousWinRate =
      previousTotalTenders > 0
        ? (previousStatusCounts.awarded || 0) / previousTotalTenders
        : 0;

    // Calculate Percentage Changes
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0; // 100% growth if starting from 0
      }
      return ((current - previous) / previous) * 100;
    };

    const valueTrend = calculateTrend(totalValue, previousTotalValue);
    const winRateTrend = calculateTrend(winRate, previousWinRate);

    return {
      success: true,
      stats: {
        totalTenders,
        statusCounts: {
          open: statusCounts.open || 0,
          closed: statusCounts.closed || 0,
          evaluation: statusCounts.evaluation || 0,
          awarded: statusCounts.awarded || 0,
          lost: statusCounts.lost || 0,
        },
        totalValue,
        winRate,
        averageValue,
        upcomingDeadlines,
        overdueCount,
        trends: {
          value: valueTrend,
          winRate: winRateTrend,
        },
      },
    };
  } catch (error: any) {
    console.error('Error fetching tender stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch tender statistics',
      stats: {
        totalTenders: 0,
        statusCounts: {
          open: 0,
          closed: 0,
          evaluation: 0,
          awarded: 0,
          lost: 0,
        },
        totalValue: 0,
        winRate: 0,
        averageValue: 0,
        upcomingDeadlines: 0,
        overdueCount: 0,
      },
    };
  }
}

// Get recent activity for dashboard
export async function getRecentActivity(
  organizationId: string,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Get recent tenders
    const recentTenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        status: tender.status,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          name: client.name,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt))
      )
      .orderBy(desc(tender.createdAt))
      .limit(limit);

    // Get recent status changes (tenders updated in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentChanges = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        status: tender.status,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          name: client.name,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          gte(tender.updatedAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(tender.updatedAt))
      .limit(limit);

    return {
      success: true,
      activity: {
        recentTenders,
        recentChanges,
      },
    };
  } catch (error: any) {
    console.error('Error fetching recent activity:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch recent activity',
      activity: {
        recentTenders: [],
        recentChanges: [],
      },
    };
  }
}

// Get upcoming deadlines for dashboard
export async function getUpcomingDeadlines(
  organizationId: string,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    const now = nowInSAST();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const upcomingTenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        status: tender.status,
        value: tender.value,
        client: {
          name: client.name,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          gte(tender.submissionDate, now),
          lte(tender.submissionDate, thirtyDaysFromNow)
        )
      )
      .orderBy(tender.submissionDate)
      .limit(limit);

    // Calculate days until deadline for each tender
    const tendersWithDays = upcomingTenders.map((tender) => ({
      ...tender,
      daysUntilDeadline: tender.submissionDate
        ? Math.ceil(
            (tender.submissionDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    return {
      success: true,
      deadlines: tendersWithDays,
    };
  } catch (error: any) {
    console.error('Error fetching upcoming deadlines:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch upcoming deadlines',
      deadlines: [],
    };
  }
}

// Get upcoming briefing sessions for dashboard
export async function getUpcomingBriefings(
  organizationId: string,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    const now = nowInSAST();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const upcomingBriefings = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        briefingDate: tender.briefingDate,
        briefingLocation: tender.briefingLocation,
        isBriefingMandatory: tender.isBriefingMandatory,
        briefingAttended: tender.briefingAttended,
        status: tender.status,
        client: {
          name: client.name,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          gte(tender.briefingDate, now),
          lte(tender.briefingDate, thirtyDaysFromNow)
        )
      )
      .orderBy(tender.briefingDate)
      .limit(limit);

    // Calculate days until briefing
    const briefingsWithDays = upcomingBriefings.map((briefing) => ({
      ...briefing,
      daysUntilBriefing: briefing.briefingDate
        ? Math.ceil(
            (briefing.briefingDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    return {
      success: true,
      briefings: briefingsWithDays,
    };
  } catch (error: any) {
    console.error('Error fetching upcoming briefings:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch upcoming briefings',
      briefings: [],
    };
  }
}

// Get tenders with custom status sorting for submitted tenders page
export async function getTendersWithCustomSorting(
  organizationId: string,
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt),
      ne(tender.status, 'open') // Exclude open tenders
    );

    // Add search condition if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(tender.tenderNumber, searchTerm),
          ilike(tender.description, searchTerm)
        )
      );
    }

    // Custom sorting: evaluation → awarded → lost → closed, then by submission date desc within each group
    const statusOrder = ['evaluation', 'awarded', 'lost', 'closed'];
    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        evaluationDate: tender.evaluationDate,
        validityDays: tender.validityDays,
        validityDate: tender.validityDate,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(whereCondition)
      .orderBy(
        // First sort by custom status order
        ...statusOrder.map((status) => desc(eq(tender.status, status))),
        // Then by submission date (most recent first)
        desc(tender.submissionDate),
        // Finally by created date as fallback
        desc(tender.createdAt)
      )
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: tender.id })
      .from(tender)
      .where(whereCondition);

    const totalCount = totalCountResult.length;

    return {
      success: true,
      tenders,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error: any) {
    console.error('Error fetching tenders with custom sorting:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch tenders',
      tenders: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
    };
  }
}

// Get filtered tenders for overview table
export async function getTendersOverview(
  organizationId: string,
  filters: {
    status?: string;
    clientId?: string;
    search?: string;
    sortBy?: 'tenderNumber' | 'createdAt' | 'submissionDate' | 'status';
    sortOrder?: 'asc' | 'desc';
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(tender.organizationId, organizationId),
      isNull(tender.deletedAt)
    );

    // Add filters
    if (filters.status && filters.status !== 'all') {
      whereCondition = and(whereCondition, eq(tender.status, filters.status));
    }

    if (filters.clientId && filters.clientId !== 'all') {
      whereCondition = and(
        whereCondition,
        eq(tender.clientId, filters.clientId)
      );
    }

    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(tender.tenderNumber, searchTerm),
          ilike(tender.description, searchTerm)
        )
      );
    }

    // Determine sort column
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    let sortColumn;
    switch (sortBy) {
      case 'tenderNumber':
        sortColumn = tender.tenderNumber;
        break;
      case 'submissionDate':
        sortColumn = tender.submissionDate;
        break;
      case 'status':
        sortColumn = tender.status;
        break;
      default:
        sortColumn = tender.createdAt;
    }

    const orderByExpression =
      sortBy === 'submissionDate'
        ? sortOrder === 'desc'
          ? sql`${tender.submissionDate} desc nulls last`
          : sql`${tender.submissionDate} asc nulls last`
        : sortOrder === 'desc'
          ? desc(sortColumn)
          : sortColumn;
    const isRegisterDefaultSort =
      (!filters.status || filters.status === 'all') &&
      sortBy === 'submissionDate' &&
      sortOrder === 'asc';
    const orderByExpressions = isRegisterDefaultSort
      ? [
          sql`case when ${tender.status} = 'open' then 0 else 1 end`,
          sql`${tender.submissionDate} asc nulls last`,
          desc(tender.createdAt),
        ]
      : [orderByExpression];

    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        value: tender.value,
        status: tender.status,
        evaluationDate: tender.evaluationDate,
        validityDays: tender.validityDays,
        validityDate: tender.validityDate,
        createdAt: tender.createdAt,
        updatedAt: tender.updatedAt,
        client: {
          id: client.id,
          name: client.name,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(whereCondition)
      .orderBy(...orderByExpressions)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: tender.id })
      .from(tender)
      .where(whereCondition);

    const totalCount = totalCountResult.length;

    return {
      success: true,
      tenders,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error: any) {
    console.error('Error fetching tenders overview:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch tenders',
      tenders: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
    };
  }
}

// Get tenders closing soon (within 7 days) for the overview dashboard
export async function getClosingSoonTenders(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const now = nowInSAST();
    const sevenDaysFromNow = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const closingSoonTenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        submissionDate: tender.submissionDate,
        status: tender.status,
        value: tender.value,
        client: {
          name: client.name,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          gte(tender.submissionDate, now),
          lte(tender.submissionDate, sevenDaysFromNow)
        )
      )
      .orderBy(tender.submissionDate)
      .limit(10);

    // Calculate days until deadline for each tender
    const tendersWithDays = closingSoonTenders.map((t) => ({
      ...t,
      daysUntilDeadline: t.submissionDate
        ? Math.ceil(
            (t.submissionDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    return {
      success: true,
      tenders: tendersWithDays,
    };
  } catch (error: any) {
    console.error('Error fetching closing soon tenders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch closing soon tenders',
      tenders: [],
    };
  }
}

// Auto-close expired tenders whose closing date is in the past and status is open
export async function autoCloseExpiredTenders(organizationId: string) {
  try {
    const now = nowInSAST();
    const result = await db
      .update(tender)
      .set({
        status: 'closed',
        updatedAt: now,
      })
      .where(
        and(
          eq(tender.organizationId, organizationId),
          eq(tender.status, 'open'),
          isNull(tender.deletedAt),
          lt(tender.submissionDate, now)
        )
      );
    return { success: true };
  } catch (error: any) {
    console.error('Error auto-closing expired tenders:', error);
    return { success: false, error: error.message || 'Failed to auto-close expired tenders' };
  }
}
