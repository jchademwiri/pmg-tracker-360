'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, FileText, Building, Save, Plus, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createPurchaseOrder, updatePurchaseOrder } from '@/server/purchase-orders';
import { getProjects } from '@/server/projects';
import { ProjectCreateDialog } from '@/components/projects/project-create-dialog';
import { toSASTDateString, parseDateToUTC } from '@/lib/timezone';
import { formatCurrency } from '@/lib/format';

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Unit price must be zero or positive',
  }),
});

const poFormSchema = z
  .object({
    poNumber: z.string().min(1, 'PO Number is required'),
    projectId: z.string().min(1, 'Project is required'),
    supplierName: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    totalAmount: z.string().min(1, 'Total amount is required'),
    status: z.enum(['open', 'sent', 'partially_delivered', 'delivered', 'completed', 'cancelled', 'disputed']),
    poDate: z.date().optional(),
    expectedDeliveryDate: z.date().optional(),
    deliveryAddress: z.string().optional(),
    lineItems: z.array(lineItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.poDate && data.expectedDeliveryDate) {
        return data.expectedDeliveryDate > data.poDate;
      }
      return true;
    },
    {
      message: 'Expected delivery date must be after the PO date',
      path: ['expectedDeliveryDate'],
    }
  );

interface POFormValues {
  poNumber: string;
  projectId: string;
  supplierName?: string;
  description: string;
  totalAmount: string;
  status: 'open' | 'sent' | 'partially_delivered' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  poDate?: Date;
  expectedDeliveryDate?: Date;
  deliveryAddress?: string;
  lineItems?: Array<{
    id?: string;
    description: string;
    quantity: string;
    unitPrice: string;
  }>;
}

interface POFormProps {
  organizationId: string;
  initialData?: {
    id?: string;
    poNumber?: string;
    projectId: string;
    supplierName?: string;
    description: string;
    totalAmount: string;
    status: 'open' | 'sent' | 'partially_delivered' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
    poDate?: Date;
    expectedDeliveryDate?: Date;
    deliveryAddress?: string;
    lineItems?: Array<{
      id?: string;
      description: string;
      quantity: string;
      unitPrice: string;
    }>;
  };
  onSuccess?: () => void;
}

export function POForm({
  organizationId,
  initialData,
  onSuccess,
}: POFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      poNumber: initialData?.poNumber || '',
      projectId: initialData?.projectId || '',
      supplierName: initialData?.supplierName || '',
      description: initialData?.description || '',
      totalAmount: initialData?.totalAmount || '0.00',
      status: initialData?.status || 'open',
      poDate: initialData?.poDate,
      expectedDeliveryDate: initialData?.expectedDeliveryDate,
      deliveryAddress: initialData?.deliveryAddress || '',
      lineItems: initialData?.lineItems || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const watchedLineItems = form.watch('lineItems');

  // Auto-calculate totalAmount when lineItems change
  useEffect(() => {
    if (watchedLineItems) {
      const total = watchedLineItems.reduce((acc, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return acc + qty * price;
      }, 0);
      form.setValue('totalAmount', total.toFixed(2));
    }
  }, [watchedLineItems, form]);

  const watchedTotal = parseFloat(form.watch('totalAmount')) || 0;
  const vatExclusive = watchedTotal;
  const vatAmount = watchedTotal * 0.15;
  const vatInclusive = watchedTotal * 1.15;

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const result = await getProjects(organizationId, '', 1, 100);
        setProjects(result.projects);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [organizationId]);

  const onSubmit = async (data: POFormValues) => {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          // Update existing PO
          const result = await updatePurchaseOrder(
            organizationId,
            initialData.id,
            data
          );
          if (result.success) {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push('/projects/purchase-orders');
            }
          } else {
            alert(result.error || 'Failed to update purchase order');
          }
        } else {
          // Create new PO
          const result = await createPurchaseOrder(organizationId, data);
          if (result.success) {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push('/projects/purchase-orders');
            }
          } else {
            alert(result.error || 'Failed to create purchase order');
          }
        }
      } catch (error) {
        console.error('Form submission error:', error);
        alert('An error occurred while saving the purchase order');
      }
    });
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">
            {initialData?.id ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          <p className="text-muted-foreground">
            {initialData?.id
              ? 'Update purchase order information and details'
              : 'Create a new purchase order with project and supplier details'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Purchase Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="poNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter PO number (e.g., PO-001)"
                          {...field}
                          onChange={(e) => {
                            const upperValue = e.target.value.toUpperCase();
                            field.onChange(upperValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter purchase order description"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount (ZAR) (calculated)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                              R
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-8 bg-muted font-medium cursor-not-allowed"
                              readOnly
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="open">Open</SelectItem>
                             <SelectItem value="sent">Sent</SelectItem>
                             <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
                             <SelectItem value="delivered">Delivered</SelectItem>
                             <SelectItem value="completed">Completed</SelectItem>
                             <SelectItem value="cancelled">Cancelled</SelectItem>
                             <SelectItem value="disputed">Disputed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="poDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={toSASTDateString(field.value)}
                          onChange={(e) => {
                            field.onChange(parseDateToUTC(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={toSASTDateString(field.value)}
                          onChange={(e) => {
                            field.onChange(parseDateToUTC(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Related Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Project &amp; Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project *</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingProjects}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingProjects ? (
                              <SelectItem value="loading" disabled>
                                Loading projects...
                              </SelectItem>
                            ) : projects.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No projects available
                              </SelectItem>
                            ) : (
                              projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.projectNumber.toUpperCase()}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <ProjectCreateDialog
                          organizationId={organizationId}
                          onProjectCreated={(newProject) => {
                            setProjects((prev) => [
                              ...prev,
                              {
                                id: newProject.id,
                                projectNumber: newProject.projectNumber,
                                description: '',
                                status: 'active',
                                client: null,
                              },
                            ]);
                            form.setValue('projectId', newProject.id);
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('projectId') ? (
                  <div className="bg-accent rounded-md p-4 mt-2">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Selected Project Details
                    </h4>
                    {(() => {
                      const selectedProject = projects.find(
                        (p) => p.id === form.watch('projectId')
                      );
                      if (!selectedProject) return null;

                      return (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="font-medium text-blue-600">
                              {selectedProject.projectNumber.toUpperCase()}
                            </span>
                          </div>
                          {selectedProject.description && (
                            <div>
                              <span className="font-medium">Description:</span>{' '}
                              {selectedProject.description}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            {selectedProject.status}
                          </div>
                          {selectedProject.client && (
                            <div>
                              <span className="font-medium">Client:</span>{' '}
                              {selectedProject.client.name}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-muted rounded-md p-4 text-center mt-2">
                    <p className="text-sm text-muted-foreground">
                      Select a project to view its details
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem className="pt-2">
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Delivery address (optional)"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Line Items Card */}
            <Card className="shadow-sm col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Package className="h-5 w-5 mr-2 text-indigo-600" />
                  PO Line Items
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: '', quantity: '1', unitPrice: '0.00' })}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[45%] pl-6">Description *</TableHead>
                        <TableHead className="w-[15%]">Quantity *</TableHead>
                        <TableHead className="w-[20%]">Unit Price (ZAR) *</TableHead>
                        <TableHead className="w-[15%]">Subtotal</TableHead>
                        <TableHead className="w-[5%] pr-6 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                            No line items added yet. Click &quot;Add Item&quot; to begin.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field, index) => {
                          const qtyVal = form.watch(`lineItems.${index}.quantity` as any);
                          const priceVal = form.watch(`lineItems.${index}.unitPrice` as any);
                          const qty = parseFloat(qtyVal || '0') || 0;
                          const price = parseFloat(priceVal || '0') || 0;
                          const subtotal = qty * price;
                          return (
                            <TableRow key={field.id}>
                              <TableCell className="pl-6">
                                <FormField
                                  control={form.control as any}
                                  name={`lineItems.${index}.description` as any}
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input placeholder="Item description" {...inputField} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control as any}
                                  name={`lineItems.${index}.quantity` as any}
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0.00"
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control as any}
                                  name={`lineItems.${index}.unitPrice` as any}
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormControl>
                                        <div className="relative">
                                          <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">
                                            R
                                          </span>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="pl-6"
                                            {...inputField}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {formatCurrency(subtotal)}
                              </TableCell>
                              <TableCell className="pr-6 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50/10 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col items-end gap-2 p-6 bg-zinc-950/20 border-t">
                  <div className="flex justify-between w-72 text-sm text-muted-foreground">
                    <span>VAT Exclusive Total:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(vatExclusive)}</span>
                  </div>
                  <div className="flex justify-between w-72 text-sm text-muted-foreground">
                    <span>VAT (15%):</span>
                    <span className="font-semibold text-foreground">{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between w-72 text-base font-bold border-t pt-2 mt-1">
                    <span className="text-indigo-600">Total (VAT Inclusive):</span>
                    <span className="text-foreground">{formatCurrency(vatInclusive)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex items-center rounded-lg justify-end space-x-4 pt-8 border-t bg-card px-6 py-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[120px] cursor-pointer"
            >
              {isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {initialData?.id ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {initialData?.id ? 'Update Purchase Order' : 'Create Purchase Order'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
