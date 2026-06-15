'use server';

import { db } from '@pmg/db';
import { validateSessionAndOrg } from './utils';
import { 
  purchaseOrder, 
  project, 
  client,
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

    const newPurchaseOrder = await db
      .insert(purchaseOrder)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        ...validatedData,
      })
      .returning();

    const poId = newPurchaseOrder[0].id;

    // Save line items
    if (data.lineItems && data.lineItems.length > 0) {
      const lineItemsToInsert = data.lineItems.map((item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const sub = (qty * price).toFixed(2);
        return {
          id: crypto.randomUUID(),
          purchaseOrderId: poId,
          description: item.description,
          quantity: qty.toString(),
          unitPrice: price.toString(),
          subtotal: sub,
        };
      });

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

    const updatedPO = await db
      .update(purchaseOrder)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrder.id, poId))
      .returning();

    // Sync line items
    if (data.lineItems) {
      const existingItems = await db
        .select()
        .from(purchaseOrderLineItem)
        .where(eq(purchaseOrderLineItem.purchaseOrderId, poId));

      const existingItemsMap = new Map(existingItems.map((item) => [item.id, item]));
      const updatedItemIds = new Set(data.lineItems.map((item: any) => item.id).filter(Boolean));

      // 1. Delete items no longer present
      const itemsToDelete = existingItems.filter((item) => !updatedItemIds.has(item.id));
      if (itemsToDelete.length > 0) {
        await db
          .delete(purchaseOrderLineItem)
          .where(inArray(purchaseOrderLineItem.id, itemsToDelete.map((i) => i.id)));
      }

      // 2. Insert or Update line items
      for (const item of data.lineItems) {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const sub = (qty * price).toFixed(2);

        if (item.id && existingItemsMap.has(item.id)) {
          // Update
          await db
            .update(purchaseOrderLineItem)
            .set({
              description: item.description,
              quantity: qty.toString(),
              unitPrice: price.toString(),
              subtotal: sub,
            })
            .where(eq(purchaseOrderLineItem.id, item.id));
        } else {
          // Create
          await db.insert(purchaseOrderLineItem).values({
            id: crypto.randomUUID(),
            purchaseOrderId: poId,
            description: item.description,
            quantity: qty.toString(),
            unitPrice: price.toString(),
            subtotal: sub,
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
        itemsToInsert.push({
          lineItemId: lineItem.id,
          quantityDelivered: deliveringQty,
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
