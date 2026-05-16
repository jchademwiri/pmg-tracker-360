import { z } from 'zod';

export const PurchaseOrderCreateSchema = z.object({
  poNumber: z.string().min(1, 'PO Number is required'),
  projectId: z.string().min(1, 'Project is required'),
  supplierName: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  totalAmount: z.string().min(1, 'Total amount is required'),
  status: z.enum(['draft', 'sent', 'delivered']),
  poDate: z.date().optional(),
  expectedDeliveryDate: z.date().optional(),
  deliveredAt: z.date().optional(),
  deliveryAddress: z.string().optional(),
});

export const PurchaseOrderUpdateSchema =
  PurchaseOrderCreateSchema.partial().extend({
    projectId: z.string().min(1, 'Project is required').optional(),
  });

export const PurchaseOrderStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'delivered']),
});

export type PurchaseOrderCreateInput = z.infer<
  typeof PurchaseOrderCreateSchema
>;
export type PurchaseOrderUpdateInput = z.infer<
  typeof PurchaseOrderUpdateSchema
>;
export type PurchaseOrderStatusUpdateInput = z.infer<
  typeof PurchaseOrderStatusUpdateSchema
>;
