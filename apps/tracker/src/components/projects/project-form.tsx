'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowLeft, FileText, User, Building } from 'lucide-react';
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

import { createProject, updateProject } from '@/server/projects';
import { getClients } from '@/server/clients';
import { getAvailableTendersForProjects } from '@/server/tenders';
import {
  ProjectCreateSchema,
  type ProjectCreateInput,
} from '@/lib/validations/project';
import { ClientCreateDialog } from '@/components/clients/client-create-dialog';

interface ProjectWithRelations {
  id: string;
  projectNumber: string;
  description: string | null;
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
  tender: {
    id: string;
    tenderNumber: string;
    description: string | null;
  } | null;
}

interface Client {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface Tender {
  id: string;
  tenderNumber: string;
  description: string | null;
  client: {
    id: string;
    name: string;
  } | null;
}

interface ProjectFormProps {
  organizationId: string;
  project?: ProjectWithRelations;
  mode: 'create' | 'edit';
}

export function ProjectForm({
  organizationId,
  project,
  mode,
}: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingTenders, setLoadingTenders] = useState(true);

  const form = useForm<ProjectCreateInput>({
    resolver: zodResolver(ProjectCreateSchema),
    defaultValues: {
      projectNumber: project?.projectNumber || '',
      description: project?.description || '',
      clientId: project?.client?.id || 'none',
      tenderId: project?.tender?.id || 'none',
      status:
        (project?.status as 'active' | 'completed' | 'cancelled') || 'active',
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

  // Load tenders on component mount and when client changes
  const selectedClientId = form.watch('clientId');

  const loadTenders = useCallback(
    async (clientId?: string) => {
      try {
        setLoadingTenders(true);
        const result = await getAvailableTendersForProjects(
          organizationId,
          clientId,
          1,
          100
        );
        setTenders(result.tenders);
      } catch (error) {
        console.error('Error loading tenders:', error);
      } finally {
        setLoadingTenders(false);
      }
    },
    [organizationId]
  );

  useEffect(() => {
    const clientId =
      selectedClientId && selectedClientId !== 'none'
        ? selectedClientId
        : undefined;
    loadTenders(clientId);
  }, [selectedClientId, loadTenders]);

  // Prefill form when tender is selected
  const selectedTenderId = form.watch('tenderId');
  useEffect(() => {
    if (selectedTenderId && selectedTenderId !== 'none') {
      const selectedTender = tenders.find((t) => t.id === selectedTenderId);
      if (selectedTender) {
        // Prefill project number and description from tender
        form.setValue('projectNumber', selectedTender.tenderNumber);
        form.setValue('description', selectedTender.description || '');

        // Prefill client if not already set
        if (
          !form.getValues('clientId') ||
          form.getValues('clientId') === 'none'
        ) {
          form.setValue('clientId', selectedTender.client?.id || 'none');
        }
      }
    }
  }, [selectedTenderId, tenders, form]);

  const onSubmit = (data: ProjectCreateInput) => {
    setError(null);

    // Convert "none" values to undefined
    const processedData = {
      ...data,
      clientId: data.clientId === 'none' ? undefined : data.clientId,
      tenderId: data.tenderId === 'none' ? undefined : data.tenderId,
    };

    startTransition(async () => {
      try {
        let result;

        if (mode === 'create') {
          result = await createProject(organizationId, processedData);
        } else if (project) {
          result = await updateProject(
            organizationId,
            project.id,
            processedData
          );
        }

        if (result?.success) {
          router.push('/projects');
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
            {mode === 'create' ? 'Add New Project' : 'Edit Project'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? 'Create a new project with client and tender details'
              : 'Update project information and details'}
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
                  name="projectNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter unique project number"
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
                      <FormLabel>Client</FormLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isPending || loadingClients}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a client (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No client</SelectItem>
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
                                  {client.name}
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
                                contactName: null,
                                contactEmail: null,
                                contactPhone: null,
                              },
                            ]);
                            form.setValue('clientId', newClient.id);
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Tender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isPending || loadingTenders}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tender (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No tender</SelectItem>
                          {loadingTenders ? (
                            <SelectItem value="loading" disabled>
                              Loading tenders...
                            </SelectItem>
                          ) : tenders.length === 0 ? (
                            <SelectItem value="no-tenders" disabled>
                              No tenders available
                            </SelectItem>
                          ) : (
                            tenders.map((tender) => (
                              <SelectItem key={tender.id} value={tender.id}>
                                {tender.tenderNumber.toUpperCase()}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
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
                          placeholder="Enter project description..."
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

            {/* Related Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Related Information
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Client and tender details for this project
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
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

                {/* Tender Information Display */}
                {form.watch('tenderId') && (
                  <div className="bg-accent rounded-md p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Selected Tender Information
                    </h4>
                    {(() => {
                      const selectedTender = tenders.find(
                        (t) => t.id === form.watch('tenderId')
                      );
                      if (!selectedTender) return null;

                      return (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {selectedTender.tenderNumber.toUpperCase()}
                          </div>
                          {selectedTender.description && (
                            <div>Description: {selectedTender.description}</div>
                          )}
                          {selectedTender.client && (
                            <div>Client: {selectedTender.client.name}</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
              disabled={isPending || loadingClients || loadingTenders}
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
                  {mode === 'create' ? 'Create Project' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
