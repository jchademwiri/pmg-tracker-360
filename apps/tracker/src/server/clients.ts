'use server';

import { db } from '@pmg/db';
import { client, tender } from '@pmg/db/schema';
import { eq, and, isNull, ilike, or, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  ClientCreateSchema,
  ClientUpdateSchema,
  type ClientCreateInput,
  type ClientUpdateInput,
} from '@/lib/validations/client';

export async function getClients(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(client.organizationId, organizationId),
      isNull(client.deletedAt)
    );

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
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}

export async function createClient(
  organizationId: string,
  data: ClientCreateInput
) {
  try {
    const validatedData = ClientCreateSchema.parse(data);

    const newClient = await db
      .insert(client)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        ...validatedData,
      })
      .returning();

    revalidatePath('/dashboard/clients');
    return { success: true, client: newClient[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to create client' };
  }
}

export async function getClientById(organizationId: string, clientId: string) {
  try {
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

    if (clientData.length === 0) return { success: false, error: 'Client not found' };
    return { success: true, client: clientData[0] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch client' };
  }
}

export async function updateClient(
  organizationId: string,
  clientId: string,
  data: ClientUpdateInput
) {
  try {
    const validatedData = ClientUpdateSchema.parse(data);

    const existingClient = await db
      .select()
      .from(client)
      .where(and(eq(client.id, clientId), eq(client.organizationId, organizationId), isNull(client.deletedAt)))
      .limit(1);

    if (existingClient.length === 0) return { success: false, error: 'Client not found' };

    const updatedClient = await db
      .update(client)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(client.id, clientId))
      .returning();

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { success: true, client: updatedClient[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.errors };
    }
    return { success: false, error: 'Failed to update client' };
  }
}

export async function deleteClient(organizationId: string, clientId: string) {
  try {
    const existingClient = await db
      .select()
      .from(client)
      .where(and(eq(client.id, clientId), eq(client.organizationId, organizationId), isNull(client.deletedAt)))
      .limit(1);

    if (existingClient.length === 0) return { success: false, error: 'Client not found' };

    const activeTenders = await db
      .select({ id: tender.id })
      .from(tender)
      .where(and(eq(tender.clientId, clientId), isNull(tender.deletedAt)))
      .limit(1);

    if (activeTenders.length > 0) {
      return { success: false, error: 'Cannot delete client with active tenders. Please delete the tenders first.' };
    }

    await db.update(client).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(client.id, clientId));

    revalidatePath('/dashboard/clients');
    return { success: true, message: 'Client deleted successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to delete client' };
  }
}

export async function searchClients(organizationId: string, query: string, limit: number = 20) {
  try {
    if (!query.trim()) return { success: true, clients: [] };

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
  } catch (error) {
    return { success: false, error: 'Failed to search clients', clients: [] };
  }
}
