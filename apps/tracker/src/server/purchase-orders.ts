'use server';

import { db } from '@pmg/db';
import { purchaseOrder, project, client } from '@pmg/db/schema';
import { eq, and, isNull, ilike, or, desc, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  PurchaseOrderCreateSchema,
  PurchaseOrderUpdateSchema,
  PurchaseOrderStatusUpdateSchema,
  type PurchaseOrderCreateInput,
  type PurchaseOrderUpdateInput,
  type PurchaseOrderStatusUpdateInput,
} from '@/lib/validations/purchase-order';

export async function getPurchaseOrders(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  projectId?: string,
  status?: string
) {
  try {
    const offset = (page - 1) * limit;

    let whereCondition = and(eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt));

    if (projectId) whereCondition = and(whereCondition, eq(purchaseOrder.projectId, projectId));

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(whereCondition, or(ilike(purchaseOrder.supplierName, searchTerm), ilike(purchaseOrder.description, searchTerm)));
    }

    if (status && status !== 'all') whereCondition = and(whereCondition, eq(purchaseOrder.status, status));

    const purchaseOrders = await db
      .select({
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        supplierName: purchaseOrder.supplierName,
        description: purchaseOrder.description,
        totalAmount: purchaseOrder.totalAmount,
        status: purchaseOrder.status,
        poDate: purchaseOrder.poDate,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        deliveredAt: purchaseOrder.deliveredAt,
        deliveryAddress: purchaseOrder.deliveryAddress,
        createdAt: purchaseOrder.createdAt,
        updatedAt: purchaseOrder.updatedAt,
        project: { id: project.id, projectNumber: project.projectNumber, description: project.description },
      })
      .from(purchaseOrder)
      .leftJoin(project, eq(purchaseOrder.projectId, project.id))
      .leftJoin(client, eq(project.clientId, client.id))
      .where(whereCondition)
      .orderBy(desc(purchaseOrder.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db.select({ count: purchaseOrder.id }).from(purchaseOrder).where(whereCondition);

    return { purchaseOrders, totalCount: totalCount.length, currentPage: page, totalPages: Math.ceil(totalCount.length / limit) };
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    throw new Error('Failed to fetch purchase orders');
  }
}

export async function createPurchaseOrder(organizationId: string, data: PurchaseOrderCreateInput) {
  try {
    const validatedData = PurchaseOrderCreateSchema.parse(data);

    const projectExists = await db.select().from(project).where(and(eq(project.id, validatedData.projectId), eq(project.organizationId, organizationId), isNull(project.deletedAt))).limit(1);
    if (projectExists.length === 0) return { success: false, error: 'Project not found' };

    const existingPO = await db.select().from(purchaseOrder).where(and(eq(purchaseOrder.poNumber, validatedData.poNumber), eq(purchaseOrder.organizationId, organizationId))).limit(1);
    if (existingPO.length > 0) return { success: false, error: 'PO Number already exists in this organization' };

    const newPurchaseOrder = await db.insert(purchaseOrder).values({ id: crypto.randomUUID(), organizationId, ...validatedData }).returning();

    revalidatePath('/dashboard/purchase-orders');
    revalidatePath(`/dashboard/projects/${validatedData.projectId}`);
    return { success: true, purchaseOrder: newPurchaseOrder[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.issues };
    return { success: false, error: 'Failed to create purchase order' };
  }
}

export async function getPurchaseOrderById(organizationId: string, poId: string) {
  try {
    const poData = await db
      .select({
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        supplierName: purchaseOrder.supplierName,
        description: purchaseOrder.description,
        totalAmount: purchaseOrder.totalAmount,
        status: purchaseOrder.status,
        poDate: purchaseOrder.poDate,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        deliveredAt: purchaseOrder.deliveredAt,
        deliveryAddress: purchaseOrder.deliveryAddress,
        createdAt: purchaseOrder.createdAt,
        updatedAt: purchaseOrder.updatedAt,
        project: { id: project.id, projectNumber: project.projectNumber, description: project.description },
      })
      .from(purchaseOrder)
      .leftJoin(project, eq(purchaseOrder.projectId, project.id))
      .where(and(eq(purchaseOrder.id, poId), eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt)))
      .limit(1);

    if (poData.length === 0) return { success: false, error: 'Purchase order not found' };
    return { success: true, purchaseOrder: poData[0] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch purchase order' };
  }
}

export async function updatePurchaseOrder(organizationId: string, poId: string, data: PurchaseOrderUpdateInput) {
  try {
    const validatedData = PurchaseOrderUpdateSchema.parse(data);

    const existingPO = await db.select().from(purchaseOrder).where(and(eq(purchaseOrder.id, poId), eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt))).limit(1);
    if (existingPO.length === 0) return { success: false, error: 'Purchase order not found' };

    if (validatedData.poNumber) {
      const duplicate = await db.select().from(purchaseOrder).where(and(eq(purchaseOrder.poNumber, validatedData.poNumber), eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt), ne(purchaseOrder.id, poId))).limit(1);
      if (duplicate.length > 0) return { success: false, error: 'PO Number already exists in this organization' };
    }

    const updatedPO = await db.update(purchaseOrder).set({ ...validatedData, updatedAt: new Date() }).where(eq(purchaseOrder.id, poId)).returning();

    revalidatePath('/dashboard/purchase-orders');
    revalidatePath(`/dashboard/purchase-orders/${poId}`);
    return { success: true, purchaseOrder: updatedPO[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.issues };
    return { success: false, error: 'Failed to update purchase order' };
  }
}

export async function updatePurchaseOrderStatus(organizationId: string, poId: string, data: PurchaseOrderStatusUpdateInput) {
  try {
    const validatedData = PurchaseOrderStatusUpdateSchema.parse(data);

    const existingPO = await db.select().from(purchaseOrder).where(and(eq(purchaseOrder.id, poId), eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt))).limit(1);
    if (existingPO.length === 0) return { success: false, error: 'Purchase order not found' };

    if (existingPO[0]?.status === 'delivered') return { success: false, error: 'Cannot change status of a delivered purchase order' };

    const updatedPO = await db
      .update(purchaseOrder)
      .set({ status: validatedData.status, deliveredAt: validatedData.status === 'delivered' ? new Date() : undefined, updatedAt: new Date() })
      .where(eq(purchaseOrder.id, poId))
      .returning();

    revalidatePath('/dashboard/purchase-orders');
    revalidatePath(`/dashboard/purchase-orders/${poId}`);
    return { success: true, purchaseOrder: updatedPO[0] };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Invalid input data', details: error.issues };
    return { success: false, error: 'Failed to update purchase order status' };
  }
}

export async function deletePurchaseOrder(organizationId: string, poId: string) {
  try {
    const existingPO = await db.select().from(purchaseOrder).where(and(eq(purchaseOrder.id, poId), eq(purchaseOrder.organizationId, organizationId), isNull(purchaseOrder.deletedAt))).limit(1);
    if (existingPO.length === 0) return { success: false, error: 'Purchase order not found' };

    await db.update(purchaseOrder).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(purchaseOrder.id, poId));

    revalidatePath('/dashboard/purchase-orders');
    return { success: true, message: 'Purchase order deleted successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to delete purchase order' };
  }
}
