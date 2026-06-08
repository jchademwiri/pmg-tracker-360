'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, FileText, Building, Save } from 'lucide-react';
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
  createPurchaseOrder,
  updatePurchaseOrder,
} from '@/server/purchase-orders';
import { getProjects } from '@/server/projects';
import { ProjectCreateDialog } from '@/components/projects/project-create-dialog';

const poFormSchema = z
  .object({
    poNumber: z.string().min(1, 'PO Number is required'),
    projectId: z.string().min(1, 'Project is required'),
    supplierName: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    totalAmount: z.string().min(1, 'Total amount is required'),
    status: z.enum(['open', 'sent', 'delivered']),
    poDate: z.date().optional(),
    expectedDeliveryDate: z.date().optional(),
    deliveryAddress: z.string().optional(),
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

type POFormValues = z.infer<typeof poFormSchema>;

interface POFormProps {
  organizationId: string;
  initialData?: {
    id?: string;
    poNumber?: string;
    projectId: string;
    supplierName?: string;
    description: string;
    totalAmount: string;
    status: 'open' | 'sent' | 'delivered';
    poDate?: Date;
    expectedDeliveryDate?: Date;
    deliveryAddress?: string;
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
      totalAmount: initialData?.totalAmount || '',
      status: initialData?.status || 'open',
      poDate: initialData?.poDate,
      expectedDeliveryDate: initialData?.expectedDeliveryDate,
      deliveryAddress: initialData?.deliveryAddress || '',
    },
  });

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
                        <FormLabel>Total Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
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
                             <SelectItem value="delivered">Delivered</SelectItem>
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
                          value={
                            field.value
                              ? field.value.toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            field.onChange(date);
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
                          value={
                            field.value
                              ? field.value.toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            field.onChange(date);
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
              <CardContent className="space-y-6p-6">
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
                    <FormItem className="py-2">
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Project Information
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Details of the selected project
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {form.watch('projectId') ? (
                  <div className="bg-accent rounded-md p-4">
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
                  <div className="bg-muted rounded-md p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a project to view its details
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
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
                  {initialData?.id
                    ? 'Update Purchase Order'
                    : 'Create Purchase Order'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
