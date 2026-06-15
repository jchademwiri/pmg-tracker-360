'use server';

import { db } from '@pmg/db';
import { validateSessionAndOrg } from './utils';
import { 
  purchaseOrder, 
  project, 
  client,
  projectLineItem,
  purchaseOrderLineItem,
  purchaseOrderDeliveryNote,
  purchaseOrderDeliveryItem,
  projectActivity
} from '@pmg/db/schema';
import { eq, and, isNull, ilike, or, desc, ne, inArray, sql } from 'drizzle-orm';
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

export async function getPurchaseOrderBreadcrumbLabel(poId: string) {
  try {
    const po = await db
      .select({ poNumber: purchaseOrder.poNumber })
      .from(purchaseOrder)
      .where(and(eq(purchaseOrder.id, poId), isNull(purchaseOrder.deletedAt)))
      .limit(1);

    return po[0]?.poNumber || null;
  } catch (error) {
    console.error('Error fetching purchase order breadcrumb label:', error);
    return null;
  }
}

export async function getProjectLineItemBreadcrumbLabel(lineItemId: string) {
  try {
    const item = await db
      .select({
        itemNumber: projectLineItem.itemNumber,
        description: projectLineItem.description,
      })
      .from(projectLineItem)
      .where(and(eq(projectLineItem.id, lineItemId), isNull(projectLineItem.deletedAt)))
      .limit(1);

    return item[0] ? `${item[0].itemNumber} - ${item[0].description}` : null;
  } catch (error) {
    console.error('Error fetching project line item breadcrumb label:', error);
    return null;
  }
}

type POLineItemInput = {
  id?: string;
  projectLineItemId: string;
  quantity: string;
};

export async function getProjectLineItems(organizationId: string, projectId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    const items = await db
      .select({
        id: projectLineItem.id,
        organizationId: projectLineItem.organizationId,
        projectId: projectLineItem.projectId,
        itemNumber: projectLineItem.itemNumber,
        sapReference: projectLineItem.sapReference,
        description: projectLineItem.description,
        unit: projectLineItem.unit,
        unitPrice: projectLineItem.unitPrice,
        createdAt: projectLineItem.createdAt,
        updatedAt: projectLineItem.updatedAt,
        deletedAt: projectLineItem.deletedAt,
        usageCount: sql<number>`count(${purchaseOrderLineItem.id})::int`,
      })
      .from(projectLineItem)
      .leftJoin(
        purchaseOrderLineItem,
        eq(purchaseOrderLineItem.projectLineItemId, projectLineItem.id)
      )
      .where(
        and(
          eq(projectLineItem.organizationId, organizationId),
          eq(projectLineItem.projectId, projectId),
          isNull(projectLineItem.deletedAt)
        )
      )
      .groupBy(projectLineItem.id)
      .orderBy(projectLineItem.itemNumber);

    return { success: true, lineItems: items };
  } catch (error: any) {
    console.error('Error fetching project line items:', error);
    return { success: false, error: error.message || 'Failed to fetch project line items', lineItems: [] };
  }
}

export async function getProjectLineItemById(
  organizationId: string,
  projectId: string,
  lineItemId: string
) {
  try {
    await validateSessionAndOrg(organizationId);

    const items = await db
      .select({
        id: projectLineItem.id,
        organizationId: projectLineItem.organizationId,
        projectId: projectLineItem.projectId,
        itemNumber: projectLineItem.itemNumber,
        sapReference: projectLineItem.sapReference,
        description: projectLineItem.description,
        unit: projectLineItem.unit,
        unitPrice: projectLineItem.unitPrice,
        createdAt: projectLineItem.createdAt,
        updatedAt: projectLineItem.updatedAt,
        deletedAt: projectLineItem.deletedAt,
        usageCount: sql<number>`count(${purchaseOrderLineItem.id})::int`,
      })
      .from(projectLineItem)
      .leftJoin(
        purchaseOrderLineItem,
        eq(purchaseOrderLineItem.projectLineItemId, projectLineItem.id)
      )
      .where(
        and(
          eq(projectLineItem.id, lineItemId),
          eq(projectLineItem.organizationId, organizationId),
          eq(projectLineItem.projectId, projectId),
          isNull(projectLineItem.deletedAt)
        )
      )
      .groupBy(projectLineItem.id)
      .limit(1);

    if (items.length === 0) {
      return { success: false, error: 'Project line item not found' };
    }

    return { success: true, lineItem: items[0] };
  } catch (error: any) {
    console.error('Error fetching project line item:', error);
    return { success: false, error: error.message || 'Failed to fetch project line item' };
  }
}

export async function createProjectLineItem(
  organizationId: string,
  data: {
    projectId: string;
    itemNumber: string;
    sapReference?: string;
    description: string;
    unit: string;
    unitPrice: string;
  }
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['create'],
        },
      },
    });

    if (!hasPermission) {
      return { success: false, error: 'Insufficient permissions to create line items' };
    }

    const itemNumber = data.itemNumber.trim().toUpperCase();
    const sapReference = data.sapReference?.trim() || null;
    const description = data.description.trim();
    const unit = data.unit.trim();
    const unitPrice = parseFloat(data.unitPrice);

    if (!data.projectId || !itemNumber || !description || !unit || Number.isNaN(unitPrice) || unitPrice < 0) {
      return { success: false, error: 'Project, item number, description, unit, and unit price are required.' };
    }

    const projectExists = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(
          eq(project.id, data.projectId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (projectExists.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    const duplicateItem = await db
      .select({ id: projectLineItem.id })
      .from(projectLineItem)
      .where(
        and(
          eq(projectLineItem.organizationId, organizationId),
          eq(projectLineItem.projectId, data.projectId),
          eq(projectLineItem.itemNumber, itemNumber),
          isNull(projectLineItem.deletedAt)
        )
      )
      .limit(1);

    if (duplicateItem.length > 0) {
      return { success: false, error: 'This item number already exists for the selected project.' };
    }

    const newItem = await db
      .insert(projectLineItem)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        projectId: data.projectId,
        itemNumber,
        sapReference,
        description,
        unit,
        unitPrice: unitPrice.toFixed(2),
      })
      .returning();

    revalidatePath('/projects/purchase-orders/create');
    revalidatePath(`/projects/${data.projectId}`);
    return { success: true, lineItem: newItem[0] };
  } catch (error: any) {
    console.error('Error creating project line item:', error);
    return { success: false, error: error.message || 'Failed to create line item' };
  }
}

export async function updateProjectLineItem(
  organizationId: string,
  projectId: string,
  lineItemId: string,
  data: {
    itemNumber: string;
    sapReference?: string;
    description: string;
    unit: string;
    unitPrice: string;
  }
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['update'],
        },
      },
    });

    if (!hasPermission) {
      return { success: false, error: 'Insufficient permissions to update line items' };
    }

    const itemNumber = data.itemNumber.trim().toUpperCase();
    const sapReference = data.sapReference?.trim() || null;
    const description = data.description.trim();
    const unit = data.unit.trim();
    const unitPrice = parseFloat(data.unitPrice);

    if (!itemNumber || !description || !unit || Number.isNaN(unitPrice) || unitPrice < 0) {
      return { success: false, error: 'Item number, description, unit, and unit price are required.' };
    }

    const existingItem = await db
      .select({ id: projectLineItem.id })
      .from(projectLineItem)
      .where(
        and(
          eq(projectLineItem.id, lineItemId),
          eq(projectLineItem.projectId, projectId),
          eq(projectLineItem.organizationId, organizationId),
          isNull(projectLineItem.deletedAt)
        )
      )
      .limit(1);

    if (existingItem.length === 0) {
      return { success: false, error: 'Project line item not found' };
    }

    const duplicateItem = await db
      .select({ id: projectLineItem.id })
      .from(projectLineItem)
      .where(
        and(
          eq(projectLineItem.organizationId, organizationId),
          eq(projectLineItem.projectId, projectId),
          eq(projectLineItem.itemNumber, itemNumber),
          isNull(projectLineItem.deletedAt),
          ne(projectLineItem.id, lineItemId)
        )
      )
      .limit(1);

    if (duplicateItem.length > 0) {
      return { success: false, error: 'This item number already exists for the selected project.' };
    }

    const updatedItem = await db
      .update(projectLineItem)
      .set({
        itemNumber,
        sapReference,
        description,
        unit,
        unitPrice: unitPrice.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(projectLineItem.id, lineItemId))
      .returning();

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/items`);
    return { success: true, lineItem: updatedItem[0] };
  } catch (error: any) {
    console.error('Error updating project line item:', error);
    return { success: false, error: error.message || 'Failed to update line item' };
  }
}

export async function archiveProjectLineItem(
  organizationId: string,
  projectId: string,
  lineItemId: string
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['delete'],
        },
      },
    });

    if (!hasPermission) {
      return { success: false, error: 'Insufficient permissions to archive line items' };
    }

    const existingItem = await db
      .select({ id: projectLineItem.id })
      .from(projectLineItem)
      .where(
        and(
          eq(projectLineItem.id, lineItemId),
          eq(projectLineItem.projectId, projectId),
          eq(projectLineItem.organizationId, organizationId),
          isNull(projectLineItem.deletedAt)
        )
      )
      .limit(1);

    if (existingItem.length === 0) {
      return { success: false, error: 'Project line item not found' };
    }

    await db
      .update(projectLineItem)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projectLineItem.id, lineItemId));

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/items`);
    return { success: true };
  } catch (error: any) {
    console.error('Error archiving project line item:', error);
    return { success: false, error: error.message || 'Failed to archive line item' };
  }
}

async function getValidatedProjectLineItemSnapshots(
  organizationId: string,
  projectId: string,
  lineItems: POLineItemInput[] = []
) {
  if (lineItems.length === 0) {
    return [];
  }

  const ids = Array.from(new Set(lineItems.map((item) => item.projectLineItemId)));
  const savedItems = await db
    .select()
    .from(projectLineItem)
    .where(
      and(
        inArray(projectLineItem.id, ids),
        eq(projectLineItem.organizationId, organizationId),
        eq(projectLineItem.projectId, projectId),
        isNull(projectLineItem.deletedAt)
      )
    );

  const savedItemMap = new Map(savedItems.map((item) => [item.id, item]));
  const missingIds = ids.filter((id) => !savedItemMap.has(id));

  if (missingIds.length > 0) {
    throw new Error('One or more selected line items do not belong to the selected project.');
  }

  return lineItems.map((item) => {
    const savedItem = savedItemMap.get(item.projectLineItemId)!;
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(savedItem.unitPrice) || 0;

    if (qty <= 0) {
      throw new Error(`Quantity for "${savedItem.description}" must be greater than zero.`);
    }

    return {
      id: item.id,
      projectLineItemId: savedItem.id,
      itemNumber: savedItem.itemNumber,
      sapReference: savedItem.sapReference,
      description: savedItem.description,
      unit: savedItem.unit,
      quantity: qty.toString(),
      unitPrice: price.toString(),
      subtotal: (qty * price).toFixed(2),
    };
  });
}

function toPurchaseOrderValues(
  organizationId: string,
  data: PurchaseOrderCreateInput | PurchaseOrderUpdateInput
) {
  return {
    organizationId,
    poNumber: data.poNumber,
    projectId: data.projectId,
    supplierName: data.supplierName,
    description: data.description,
    totalAmount: data.totalAmount,
    status: data.status,
    poDate: data.poDate,
    expectedDeliveryDate: data.expectedDeliveryDate,
    deliveredAt: data.deliveredAt,
    deliveryAddress: data.deliveryAddress,
  };
}

// Get purchase orders with pagination, search, and project joins
export async function getPurchaseOrders(
  organizationId: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  projectId?: string,
  status?: string
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['read'],
        },
      },
    });

    if (!hasPermission) {
      return {
        purchaseOrders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        error: 'Insufficient permissions',
      };
    }

    const offset = (page - 1) * limit;

    let whereCondition = and(
      eq(purchaseOrder.organizationId, organizationId),
      isNull(purchaseOrder.deletedAt)
    );

    // Add project filter if provided
    if (projectId) {
      whereCondition = and(
        whereCondition,
        eq(purchaseOrder.projectId, projectId)
      );
    }

    // Add search condition if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(purchaseOrder.supplierName, searchTerm),
          ilike(purchaseOrder.description, searchTerm)
        )
      );
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereCondition = and(whereCondition, eq(purchaseOrder.status, status));
    }

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
        project: {
          id: project.id,
          projectNumber: project.projectNumber,
          description: project.description,
        },
      })
      .from(purchaseOrder)
      .leftJoin(project, eq(purchaseOrder.projectId, project.id))
      .leftJoin(client, eq(project.clientId, client.id))
      .where(whereCondition)
      .orderBy(desc(purchaseOrder.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: purchaseOrder.id })
      .from(purchaseOrder)
      .where(whereCondition);

    return {
      purchaseOrders,
      totalCount: totalCount.length,
      currentPage: page,
      totalPages: Math.ceil(totalCount.length / limit),
    };
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    throw error;
  }
}

// Create a new purchase order
export async function createPurchaseOrder(
  organizationId: string,
  data: PurchaseOrderCreateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['create'],
        },
      },
    });

    if (!hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions to create purchase order',
      };
    }

    // Validate input
    const validatedData = PurchaseOrderCreateSchema.parse(data);

    // Verify project exists and belongs to organization
    const projectExists = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, validatedData.projectId),
          eq(project.organizationId, organizationId),
          isNull(project.deletedAt)
        )
      )
      .limit(1);

    if (projectExists.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    // Check if PO number is globally unique
    const existingPO = await db
      .select()
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.poNumber, validatedData.poNumber),
          isNull(purchaseOrder.deletedAt)
        )
      )
      .limit(1);

    if (existingPO.length > 0) {
      return {
        success: false,
        error: 'This PO number is already in use. PO numbers must be unique across all organizations.',
      };
    }

    const lineItemSnapshots = await getValidatedProjectLineItemSnapshots(
      organizationId,
      validatedData.projectId,
      validatedData.lineItems as POLineItemInput[]
    );

    const poValues = {
      organizationId,
      poNumber: validatedData.poNumber,
      projectId: validatedData.projectId,
      supplierName: validatedData.supplierName,
      description: validatedData.description,
      totalAmount: validatedData.totalAmount,
      status: validatedData.status,
      poDate: validatedData.poDate,
      expectedDeliveryDate: validatedData.expectedDeliveryDate,
      deliveredAt: validatedData.deliveredAt,
      deliveryAddress: validatedData.deliveryAddress,
    };
    if (lineItemSnapshots.length > 0) {
      poValues.totalAmount = lineItemSnapshots
        .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
        .toFixed(2);
    }

    const newPurchaseOrder = await db
      .insert(purchaseOrder)
      .values({
        id: crypto.randomUUID(),
        ...poValues,
      })
      .returning();

    const poId = newPurchaseOrder[0].id;

    // Save line items
    if (lineItemSnapshots.length > 0) {
      const lineItemsToInsert = lineItemSnapshots.map((item) => ({
          id: crypto.randomUUID(),
          purchaseOrderId: poId,
          projectLineItemId: item.projectLineItemId,
          itemNumber: item.itemNumber,
          sapReference: item.sapReference,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }));

      await db.insert(purchaseOrderLineItem).values(lineItemsToInsert);
    }

    revalidatePath('/projects/purchase-orders');
    revalidatePath(`/projects/${validatedData.projectId}`);
    return { success: true, purchaseOrder: newPurchaseOrder[0] };
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to create purchase order' };
  }
}

// Get purchase order by ID with project information
export async function getPurchaseOrderById(
  organizationId: string,
  poId: string
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['read'],
        },
      },
    });

    if (!hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions to view purchase order',
      };
    }

    const po = await db.query.purchaseOrder.findFirst({
      where: and(
        eq(purchaseOrder.id, poId),
        eq(purchaseOrder.organizationId, organizationId),
        isNull(purchaseOrder.deletedAt)
      ),
      with: {
        project: true,
        lineItems: true,
        deliveryNotes: {
          orderBy: [desc(purchaseOrderDeliveryNote.receivedAt)],
          with: {
            items: {
              with: {
                lineItem: true,
              },
            },
          },
        },
      },
    });

    if (!po) {
      return { success: false, error: 'Purchase order not found' };
    }

    // Enhance delivery notes with signed URLs for PODs
    if (po.deliveryNotes && po.deliveryNotes.length > 0) {
      const { StorageService } = await import('@/lib/storage');
      const enhancedNotes = await Promise.all(
        po.deliveryNotes.map(async (note) => {
          if (note.podFileUrl) {
            try {
              const signedUrl = await StorageService.getSignedUrl(note.podFileUrl);
              return { ...note, podFileUrl: signedUrl };
            } catch (err) {
              console.error('Error signing POD url:', err);
            }
          }
          return note;
        })
      );
      // @ts-ignore
      po.deliveryNotes = enhancedNotes;
    }

    return { success: true, purchaseOrder: po };
  } catch (error: any) {
    console.error('Error fetching purchase order:', error);
    return { success: false, error: error.message || 'Failed to fetch purchase order' };
  }
}

// Update purchase order
export async function updatePurchaseOrder(
  organizationId: string,
  poId: string,
  data: PurchaseOrderUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['update'],
        },
      },
    });

    if (!hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions to update purchase order',
      };
    }

    // Validate input
    const validatedData = PurchaseOrderUpdateSchema.parse(data);

    // Check if purchase order exists and belongs to organization
    const existingPO = await db
      .select()
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.id, poId),
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt)
        )
      )
      .limit(1);

    if (existingPO.length === 0) {
      return { success: false, error: 'Purchase order not found' };
    }

    // If PO number is being updated, check uniqueness
    if (validatedData.poNumber) {
      const duplicatePO = await db
        .select()
        .from(purchaseOrder)
        .where(
          and(
            eq(purchaseOrder.poNumber, validatedData.poNumber),
            isNull(purchaseOrder.deletedAt),
            // Exclude current PO from uniqueness check
            ne(purchaseOrder.id, poId)
          )
        )
        .limit(1);

      if (duplicatePO.length > 0) {
        return {
          success: false,
          error: 'This PO number is already in use. PO numbers must be unique across all organizations.',
        };
      }
    }

    // If project is being updated, verify it exists and belongs to organization
    if (validatedData.projectId) {
      const projectExists = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.id, validatedData.projectId),
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt)
          )
        )
        .limit(1);

      if (projectExists.length === 0) {
        return { success: false, error: 'Project not found' };
      }
    }

    const targetProjectId = validatedData.projectId || existingPO[0].projectId;
    const lineItemSnapshots = data.lineItems
      ? await getValidatedProjectLineItemSnapshots(
          organizationId,
          targetProjectId,
          data.lineItems as POLineItemInput[]
        )
      : undefined;

    const poValues = toPurchaseOrderValues(organizationId, validatedData);
    if (lineItemSnapshots && lineItemSnapshots.length > 0) {
      poValues.totalAmount = lineItemSnapshots
        .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
        .toFixed(2);
    }

    const updatedPO = await db
      .update(purchaseOrder)
      .set({
        ...poValues,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrder.id, poId))
      .returning();

    // Sync line items
    if (lineItemSnapshots) {
      const existingItems = await db
        .select()
        .from(purchaseOrderLineItem)
        .where(eq(purchaseOrderLineItem.purchaseOrderId, poId));

      const existingItemsMap = new Map(existingItems.map((item) => [item.id, item]));
      const updatedItemIds = new Set(lineItemSnapshots.map((item) => item.id).filter(Boolean));

      // 1. Delete items no longer present
      const itemsToDelete = existingItems.filter((item) => !updatedItemIds.has(item.id));
      if (itemsToDelete.length > 0) {
        await db
          .delete(purchaseOrderLineItem)
          .where(inArray(purchaseOrderLineItem.id, itemsToDelete.map((i) => i.id)));
      }

      // 2. Insert or Update line items
      for (const item of lineItemSnapshots) {
        if (item.id && existingItemsMap.has(item.id)) {
          // Update
          await db
            .update(purchaseOrderLineItem)
            .set({
              projectLineItemId: item.projectLineItemId,
              itemNumber: item.itemNumber,
              sapReference: item.sapReference,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })
            .where(eq(purchaseOrderLineItem.id, item.id));
        } else {
          // Create
          await db.insert(purchaseOrderLineItem).values({
            id: crypto.randomUUID(),
            purchaseOrderId: poId,
            projectLineItemId: item.projectLineItemId,
            itemNumber: item.itemNumber,
            sapReference: item.sapReference,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          });
        }
      }
    }

    revalidatePath('/projects/purchase-orders');
    revalidatePath(`/projects/purchase-orders/${poId}`);
    if (existingPO[0].projectId) {
      revalidatePath(`/projects/${existingPO[0].projectId}`);
    }
    return { success: true, purchaseOrder: updatedPO[0] };
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update purchase order' };
  }
}

// Update purchase order status
export async function updatePurchaseOrderStatus(
  organizationId: string,
  poId: string,
  data: PurchaseOrderStatusUpdateInput
) {
  try {
    await validateSessionAndOrg(organizationId);
    // Validate input
    const validatedData = PurchaseOrderStatusUpdateSchema.parse(data);

    // Check if purchase order exists and belongs to organization
    const existingPO = await db
      .select()
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.id, poId),
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt)
        )
      )
      .limit(1);

    if (existingPO.length === 0) {
      return { success: false, error: 'Purchase order not found' };
    }

    // Check if PO is in a terminal state - cannot change status once completed or cancelled
    if (existingPO[0].status === 'completed' || existingPO[0].status === 'cancelled') {
      return {
        success: false,
        error: 'Cannot change status of a completed or cancelled purchase order',
      };
    }

    // Check user permissions - only owner and admin can change status
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission, error: permissionError } =
      await auth.api.hasPermission({
        headers: await headers(),
        body: {
          permissions: {
            purchase_order: ['update'], // Use specific PO update permission
          },
        },
      });

    if (permissionError || !hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions to change purchase order status',
      };
    }

    const updatedPO = await db
      .update(purchaseOrder)
      .set({
        status: validatedData.status,
        // Auto-set deliveredAt when status is delivered
        deliveredAt:
          validatedData.status === 'delivered' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrder.id, poId))
      .returning();

    revalidatePath('/projects/purchase-orders');
    revalidatePath(`/projects/purchase-orders/${poId}`);
    if (existingPO[0].projectId) {
      revalidatePath(`/projects/${existingPO[0].projectId}`);
    }
    return { success: true, purchaseOrder: updatedPO[0] };
  } catch (error: any) {
    console.error('Error updating purchase order status:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
        details: error.errors,
      };
    }
    return { success: false, error: error.message || 'Failed to update purchase order status' };
  }
}

// Soft delete purchase order
export async function deletePurchaseOrder(
  organizationId: string,
  poId: string
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['delete'],
        },
      },
    });

    if (!hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions to delete purchase order',
      };
    }

    // Check if purchase order exists and belongs to organization
    const existingPO = await db
      .select()
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.id, poId),
          eq(purchaseOrder.organizationId, organizationId),
          isNull(purchaseOrder.deletedAt)
        )
      )
      .limit(1);

    if (existingPO.length === 0) {
      return { success: false, error: 'Purchase order not found' };
    }

    await db
      .update(purchaseOrder)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrder.id, poId));

    revalidatePath('/projects/purchase-orders');
    if (existingPO[0].projectId) {
      revalidatePath(`/projects/${existingPO[0].projectId}`);
    }
    return { success: true, message: 'Purchase order deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    return { success: false, error: error.message || 'Failed to delete purchase order' };
  }
}

// Record PO delivery note and update quantities/status
export async function recordPODelivery(
  organizationId: string,
  poId: string,
  data: {
    deliveryNoteNumber: string;
    recipientName: string;
    receivedAt: Date;
    notes?: string;
    podFileUrl?: string;
    items: Array<{
      lineItemId: string;
      quantityDelivered: string;
    }>;
  }
) {
  try {
    await validateSessionAndOrg(organizationId);
    const { auth } = await import('@/lib/auth');
    const { headers } = await import('next/headers');

    const { success: hasPermission } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          purchase_order: ['update'],
        },
      },
    });

    if (!hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions to record purchase order delivery',
      };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    // Get purchase order with line items and existing deliveries
    const po = await db.query.purchaseOrder.findFirst({
      where: and(
        eq(purchaseOrder.id, poId),
        eq(purchaseOrder.organizationId, organizationId),
        isNull(purchaseOrder.deletedAt)
      ),
      with: {
        lineItems: true,
        deliveryNotes: {
          with: {
            items: true,
          },
        },
      },
    });

    if (!po) {
      return { success: false, error: 'Purchase order not found' };
    }

    if (po.status === 'completed' || po.status === 'cancelled') {
      return {
        success: false,
        error: 'Cannot record delivery for a completed or cancelled purchase order',
      };
    }

    // Map to find existing deliveries for line items
    const existingDeliveredQtyMap = new Map<string, number>();
    for (const note of po.deliveryNotes) {
      if (note.items) {
        for (const item of note.items) {
          const currentVal = existingDeliveredQtyMap.get(item.lineItemId) || 0;
          existingDeliveredQtyMap.set(item.lineItemId, currentVal + parseFloat(item.quantityDelivered));
        }
      }
    }

    // Validate quantities
    const itemsToInsert: Array<{
      lineItemId: string;
      quantityDelivered: number;
      unitPrice: number;
      deliveryValue: number;
    }> = [];

    for (const inputItem of data.items) {
      const lineItem = po.lineItems.find((li) => li.id === inputItem.lineItemId);
      if (!lineItem) {
        return {
          success: false,
          error: `Line item with ID ${inputItem.lineItemId} is not associated with this purchase order`,
        };
      }

      const orderedQty = parseFloat(lineItem.quantity) || 0;
      const alreadyDelivered = existingDeliveredQtyMap.get(lineItem.id) || 0;
      const outstandingQty = Math.max(0, orderedQty - alreadyDelivered);
      const deliveringQty = parseFloat(inputItem.quantityDelivered) || 0;

      if (deliveringQty < 0) {
        return {
          success: false,
          error: `Delivered quantity for item "${lineItem.description}" cannot be negative`,
        };
      }

      if (deliveringQty > outstandingQty) {
        return {
          success: false,
          error: `Cannot deliver ${deliveringQty} for "${lineItem.description}". Maximum outstanding quantity is ${outstandingQty}.`,
        };
      }

      if (deliveringQty > 0) {
        const unitPrice = parseFloat(lineItem.unitPrice) || 0;
        itemsToInsert.push({
          lineItemId: lineItem.id,
          quantityDelivered: deliveringQty,
          unitPrice,
          deliveryValue: deliveringQty * unitPrice,
        });
      }
    }

    if (itemsToInsert.length === 0) {
      return {
        success: false,
        error: 'At least one item must have a delivered quantity greater than zero',
      };
    }

    const deliveryNoteId = crypto.randomUUID();

    // Perform inside a transaction
    await db.transaction(async (tx) => {
      // 1. Insert delivery note
      await tx.insert(purchaseOrderDeliveryNote).values({
        id: deliveryNoteId,
        purchaseOrderId: poId,
        projectId: po.projectId,
        deliveryNoteNumber: data.deliveryNoteNumber,
        recipientName: data.recipientName,
        receivedAt: data.receivedAt,
        status: 'received',
        podFileUrl: data.podFileUrl || null,
        notes: data.notes || null,
      });

      // 2. Insert delivery items
      await tx.insert(purchaseOrderDeliveryItem).values(
        itemsToInsert.map((item) => ({
          id: crypto.randomUUID(),
          deliveryNoteId,
          lineItemId: item.lineItemId,
          quantityDelivered: item.quantityDelivered.toString(),
          unitPrice: item.unitPrice.toFixed(2),
          deliveryValue: item.deliveryValue.toFixed(2),
        }))
      );

      // 3. Recalculate and update PO status
      let allCompleted = true;
      let someDelivered = false;

      for (const lineItem of po.lineItems) {
        const ordered = parseFloat(lineItem.quantity) || 0;
        const previouslyDelivered = existingDeliveredQtyMap.get(lineItem.id) || 0;
        const newlyDelivered = itemsToInsert.find((item) => item.lineItemId === lineItem.id)?.quantityDelivered || 0;
        const totalDelivered = previouslyDelivered + newlyDelivered;

        if (totalDelivered < ordered) {
          allCompleted = false;
        }
        if (totalDelivered > 0) {
          someDelivered = true;
        }
      }

      // If we don't have line items (edge case), we don't change status to completed
      if (po.lineItems.length === 0) {
        allCompleted = false;
      }

      const newStatus = allCompleted ? 'completed' : someDelivered ? 'partially_delivered' : 'open';

      await tx
        .update(purchaseOrder)
        .set({
          status: newStatus,
          deliveredAt: newStatus === 'completed' ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrder.id, poId));
      
      // 4. Log project activity
      await tx.insert(projectActivity).values({
        id: crypto.randomUUID(),
        organizationId,
        projectId: po.projectId,
        activityType: 'po_delivery',
        description: `Delivery Note ${data.deliveryNoteNumber} recorded for PO ${po.poNumber}. Status updated to ${newStatus}.`,
        userId: userId || null,
      });
    });

    revalidatePath('/projects/purchase-orders');
    revalidatePath(`/projects/purchase-orders/${poId}`);
    revalidatePath(`/projects/${po.projectId}`);

    return { success: true, deliveryNoteId };
  } catch (error: any) {
    console.error('Error recording PO delivery:', error);
    return { success: false, error: error.message || 'Failed to record delivery' };
  }
}
