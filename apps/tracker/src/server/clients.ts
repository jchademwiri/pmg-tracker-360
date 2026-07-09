'use server';

import { db } from '@pmg/db';
import { client, tender, project, purchaseOrder } from '@pmg/db/schema';
import { validateSessionAndOrg } from './utils';
import { eq, and, isNull, ilike, or, desc, ne, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  ClientCreateSchema,
  ClientUpdateSchema,
  type ClientCreateInput,
  type ClientUpdateInput,
} from '@/lib/validations/client';

// Get clients with pagination and search
export async function getClients(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(client.organizationId, organizationId),
      isNull(client.deletedAt)
    );

    // Add search condition if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(client.name, searchTerm),
          ilike(client.contactName, searchTerm),
          ilike(client.contactEmail, searchTerm)
        )
      );
    }

    const clients = await db
      .select()
      .from(client)
      .where(whereCondition)
      .orderBy(desc(client.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: client.id })
      .from(client)
      .where(whereCondition);

    return {
      clients,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    throw error;
  }
}

// Create a new client
export async function createClient(
  organizationId: string,
  data: ClientCreateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = ClientCreateSchema.parse(data);

    // Check if client name is unique within organization
    const existingClient = await db
      .select()
      .from(client)
      .where(
        and(
          eq(client.organizationId, organizationId),
          eq(client.name, validatedData.name),
          isNull(client.deletedAt)
        )
      )
      .limit(1);

    if (existingClient.length > 0) {
      return {
        success: false,
        error: 'A client with this name already exists in your organization',
      };
    }

    const newClient = await db
      .insert(client)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        ...validatedData,
      })
      .returning();

    revalidatePath('/clients');
    return { success: true, client: newClient[0] };
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to create client' };
  }
}

// Get client by ID
export async function getClientById(organizationId: string, clientId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const clientData = await db
      .select()
      .from(client)
      .where(
        and(
          eq(client.id, clientId),
          eq(client.organizationId, organizationId),
          isNull(client.deletedAt)
        )
      )
      .limit(1);

    if (clientData.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    return { success: true, client: clientData[0] };
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return { success: false, error: error.message || 'Failed to fetch client' };
  }
}

// Update client
export async function updateClient(
  organizationId: string,
  clientId: string,
  data: ClientUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = ClientUpdateSchema.parse(data);

    // Check if client exists and belongs to organization
    const existingClient = await db
      .select()
      .from(client)
      .where(
        and(
          eq(client.id, clientId),
          eq(client.organizationId, organizationId),
          isNull(client.deletedAt)
        )
      )
      .limit(1);

    if (existingClient.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // If name is being updated, check uniqueness within organization
    if (validatedData.name) {
      const duplicateClient = await db
        .select()
        .from(client)
        .where(
          and(
            eq(client.organizationId, organizationId),
            eq(client.name, validatedData.name),
            isNull(client.deletedAt),
            ne(client.id, clientId)
          )
        )
        .limit(1);

      if (duplicateClient.length > 0) {
        return {
          success: false,
          error: 'A client with this name already exists in your organization',
        };
      }
    }

    const updatedClient = await db
      .update(client)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(client.id, clientId))
      .returning();

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    return { success: true, client: updatedClient[0] };
  } catch (error: any) {
    console.error('Error updating client:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update client' };
  }
}

// Soft delete client
export async function deleteClient(organizationId: string, clientId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    // Check if client exists and belongs to organization
    const existingClient = await db
      .select()
      .from(client)
      .where(
        and(
          eq(client.id, clientId),
          eq(client.organizationId, organizationId),
          isNull(client.deletedAt)
        )
      )
      .limit(1);

    if (existingClient.length === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Check if client has active tenders before deletion
    const activeTenders = await db
      .select({ id: tender.id })
      .from(tender)
      .where(and(eq(tender.clientId, clientId), isNull(tender.deletedAt)))
      .limit(1);

    if (activeTenders.length > 0) {
      return {
        success: false,
        error:
          'Cannot delete client with active tenders. Please delete the tenders first.',
      };
    }

    await db
      .update(client)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(client.id, clientId));

    revalidatePath('/clients');
    return { success: true, message: 'Client deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return { success: false, error: error.message || 'Failed to delete client' };
  }
}

// Search clients with advanced filtering
export async function searchClients(
  organizationId: string,
  query: string,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    if (!query.trim()) {
      return { success: true, clients: [] };
    }

    const searchTerm = `%${query.trim()}%`;

    const clients = await db
      .select()
      .from(client)
      .where(
        and(
          eq(client.organizationId, organizationId),
          isNull(client.deletedAt),
          or(
            ilike(client.name, searchTerm),
            ilike(client.contactName, searchTerm),
            ilike(client.contactEmail, searchTerm),
            ilike(client.contactPhone, searchTerm)
          )
        )
      )
      .orderBy(desc(client.createdAt))
      .limit(limit);

    return { success: true, clients };
  } catch (error: any) {
    console.error('Error searching clients:', error);
    return { success: false, error: error.message || 'Failed to search clients', clients: [] };
  }
}

// Get clients with sorting options
export async function getClientsWithSorting(
  organizationId: string,
  sortBy: 'name' | 'createdAt' | 'updatedAt' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  page: number = 1,
  limit: number = 10
) {
  try {
    await validateSessionAndOrg(organizationId);
    const offset = (page - 1) * limit;

    const whereCondition = and(
      eq(client.organizationId, organizationId),
      isNull(client.deletedAt)
    );

    // Determine sort column
    let sortColumn;
    switch (sortBy) {
      case 'name':
        sortColumn = client.name;
        break;
      case 'updatedAt':
        sortColumn = client.updatedAt;
        break;
      default:
        sortColumn = client.createdAt;
    }

    const clients = await db
      .select()
      .from(client)
      .where(whereCondition)
      .orderBy(sortOrder === 'desc' ? desc(sortColumn) : sortColumn)
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: client.id })
      .from(client)
      .where(whereCondition);

    return {
      success: true,
      clients,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error fetching clients with sorting:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch clients',
      clients: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
    };
  }
}

// Get related records for a client (tenders, projects, POs)
export async function getClientRelatedRecords(
  organizationId: string,
  clientId: string
) {
  try {
    await validateSessionAndOrg(organizationId);

    // Get tenders for this client
    const clientTenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        description: tender.description,
        status: tender.status,
        submissionDate: tender.submissionDate,
        value: tender.value,
        createdAt: tender.createdAt,
      })
      .from(tender)
      .where(
        and(
          eq(tender.clientId, clientId),
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      )
      .orderBy(desc(tender.createdAt));

    // Get projects for this client
    const clientProjects = await db
      .select({
        id: project.id,
        projectNumber: project.projectNumber,
        description: project.description,
        status: project.status,
        contractStartDate: project.contractStartDate,
        contractEndDate: project.contractEndDate,
        awardValue: project.awardValue,
        createdAt: project.createdAt,
      })
      .from(project)
      .where(
        and(
          eq(project.clientId, clientId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .orderBy(desc(project.createdAt));

    // Get PO counts for each project
    const projectIds = clientProjects.map((p) => p.id);
    let purchaseOrderCount = 0;
    if (projectIds.length > 0) {
      const poCountResult = await db
        .select({ count: purchaseOrder.id })
        .from(purchaseOrder)
        .where(
          and(
            inArray(purchaseOrder.projectId, projectIds),
            eq(purchaseOrder.organizationId, organizationId),
            isNull(purchaseOrder.deletedAt)
          )
        );
      purchaseOrderCount = poCountResult.length;
    }

    return {
      success: true,
      records: {
        tenders: clientTenders,
        projects: clientProjects,
        purchaseOrderCount,
      },
    };
  } catch (error: any) {
    console.error('Error fetching client related records:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch related records',
      records: { tenders: [], projects: [], purchaseOrderCount: 0 },
    };
  }
}

// Lightweight helper returning { id, name }[] for filter dropdowns
export async function getClientsList(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const result = await db
      .select({ id: client.id, name: client.name })
      .from(client)
      .where(
        and(
          eq(client.organizationId, organizationId),
          isNull(client.deletedAt)
        )
      )
      .orderBy(client.name);
    return { success: true, clients: result };
  } catch (error: any) {
    console.error('Error getting clients list:', error);
    return { success: false, clients: [], error: error.message };
  }
}

// Get client statistics for dashboard
export async function getClientStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const stats = await db
      .select({
        total: client.id,
        hasContact: client.contactEmail,
      })
      .from(client)
      .where(
        and(eq(client.organizationId, organizationId), isNull(client.deletedAt))
      );

    const totalClients = stats.length;
    const clientsWithContact = stats.filter((s) => s.hasContact).length;

    return {
      success: true,
      stats: {
        totalClients,
        clientsWithContact,
        clientsWithoutContact: totalClients - clientsWithContact,
      },
    };
  } catch (error: any) {
    console.error('Error fetching client stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch client statistics',
      stats: {
        totalClients: 0,
        clientsWithContact: 0,
        clientsWithoutContact: 0,
      },
    };
  }
}
