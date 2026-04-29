'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  ArrowLeft,
  FileText,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Button } from '@pmg/ui/components/ui/button';
import { Input } from '@pmg/ui/components/ui/input';
import { Textarea } from '@pmg/ui/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@pmg/ui/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pmg/ui/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pmg/ui/components/ui/select';

import { createTender, updateTender } from '@/server/tenders';
import { getClients } from '@/server/clients';
import {
  TenderCreateSchema,
  type TenderCreateInput,
} from '@/lib/validations/tender';
import { FileUploader } from '@pmg/ui/components/ui/file-uploader';
import { uploadDocument } from '@/server/documents';
import { ClientCreateDialog } from '@/components/clients/client-create-dialog';

interface TenderWithClient {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } | null;
}

interface Client {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface TenderFormProps {
  organizationId: string;
  tender?: TenderWithClient;
  mode: 'create' | 'edit';
}

export function TenderForm({ organizationId, tender, mode }: TenderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const form = useForm<TenderCreateInput>({
    resolver: zodResolver(TenderCreateSchema),
    defaultValues: {
      tenderNumber: tender?.tenderNumber || '',
      description: tender?.description || '',
      clientId: tender?.client?.id || '',
      submissionDate: tender?.submissionDate || undefined,
      value: tender?.value || '',
      status:
        (tender?.status as
          | 'draft'
          | 'submitted'
          | 'won'
          | 'lost'
          | 'pending') || 'draft',
    },
  });

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const result = await getClients(organizationId, '', 1, 100); // Get first 100 clients
        setClients(result.clients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [organizationId]);

  const onSubmit = (data: TenderCreateInput) => {
    setError(null);

    startTransition(async () => {
      try {
        let result;

        if (mode === 'create') {
          result = await createTender(organizationId, data);
        } else if (tender) {
          result = await updateTender(organizationId, tender.id, data);
        }

        if (result?.success) {
          // Upload files if any
          if (files.length > 0) {
            const entityId = mode === 'create' ? result.tender?.id : tender?.id;

            if (entityId) {
              await Promise.all(
                files.map(async (file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  await uploadDocument(organizationId, formData, {
                    tenderId: entityId,
                  });
                })
              );
            }
          }

          router.push('/dashboard/tenders');
          router.refresh();
        } else {
          setError(result?.error || 'An error occurred');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Form submission error:', err);
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-x-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Add New Tender' : 'Edit Tender'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? 'Create a new tender with client and submission details'
              : 'Update tender information and details'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="tenderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tender Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter unique tender number"
                          {...field}
                          onChange={(e) => {
                            const upperValue = e.target.value.toUpperCase();
                            field.onChange(upperValue);
                          }}
                          disabled={isPending}
                          className="rounded-md uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isPending || loadingClients}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingClients ? (
                              <SelectItem value="loading" disabled>
                                Loading clients...
                              </SelectItem>
                            ) : clients.length === 0 ? (
                              <SelectItem value="no-clients" disabled>
                                No clients available
                              </SelectItem>
                            ) : (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  <div className="flex flex-col">
                                    <span>{client.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <ClientCreateDialog
                          organizationId={organizationId}
                          onClientCreated={(newClient) => {
                            setClients((prev) => [
                              ...prev,
                              {
                                id: newClient.id,
                                name: newClient.name,
                                contactName: newClient.contactName || null,
                                contactEmail: newClient.contactEmail || null,
                                contactPhone: newClient.contactPhone || null,
                              },
                            ]);
                            form.setValue('clientId', newClient.id, {
                              shouldValidate: true,
                            });
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter tender description..."
                          rows={4}
                          {...field}
                          disabled={isPending}
                          className="rounded-md"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submission Details */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-green-600" />
                  Submission Details
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Financial and timeline information (optional)
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="submissionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            type="date"
                            className="pl-10 rounded-md"
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .split('T')[0]
                                : ''
                            }
                            onChange={(e) => {
                              const date = e.target.value
                                ? new Date(e.target.value)
                                : undefined;
                              field.onChange(date);
                            }}
                            disabled={isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tender Value</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            type="text"
                            placeholder="Enter tender value"
                            className="pl-10 rounded-md"
                            {...field}
                            disabled={isPending}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Information Display */}
                {form.watch('clientId') && (
                  <div className="bg-accent rounded-md p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Selected Client Information
                    </h4>
                    {(() => {
                      const selectedClient = clients.find(
                        (c) => c.id === form.watch('clientId')
                      );
                      if (!selectedClient) return null;

                      return (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {selectedClient.name}
                          </div>
                          {selectedClient.contactName && (
                            <div>Contact: {selectedClient.contactName}</div>
                          )}
                          {selectedClient.contactEmail && (
                            <div>Email: {selectedClient.contactEmail}</div>
                          )}
                          {selectedClient.contactPhone && (
                            <div>Phone: {selectedClient.contactPhone}</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documents */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Documents
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Upload tender documents, specifications, or requirements (PDF,
                Word, Excel, Images)
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                <p className="text-muted-foreground mb-2">
                  Document upload is currently unavailable
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Coming soon in a future update
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center rounded-lg justify-end space-x-4 pt-8 border-t bg-card px-6 py-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || loadingClients}
              className="min-w-[120px] cursor-pointer"
            >
              {isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Tender' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
