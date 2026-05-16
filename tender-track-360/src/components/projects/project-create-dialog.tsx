'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createProject } from '@/server/projects';
import { getClients } from '@/server/clients';
import {
  ProjectCreateSchema,
  type ProjectCreateInput,
} from '@/lib/validations/project';
import { ClientCreateDialog } from '@/components/clients/client-create-dialog';

interface ProjectCreateDialogProps {
  organizationId: string;
  onProjectCreated: (project: { id: string; projectNumber: string }) => void;
  trigger?: React.ReactNode;
}

interface Client {
  id: string;
  name: string;
}

export function ProjectCreateDialog({
  organizationId,
  onProjectCreated,
  trigger,
}: ProjectCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProjectCreateInput>({
    resolver: zodResolver(ProjectCreateSchema),
    defaultValues: {
      projectNumber: '',
      description: '',
      clientId: '',
      status: 'active',
    },
  });

  // Load clients when dialog opens
  useEffect(() => {
    if (open && clients.length === 0) {
      const loadClients = async () => {
        try {
          setLoadingClients(true);
          const result = await getClients(organizationId, '', 1, 100);
          setClients(result.clients);
        } catch (error) {
          console.error('Error loading clients:', error);
        } finally {
          setLoadingClients(false);
        }
      };
      loadClients();
    }
  }, [open, clients.length, organizationId]);

  const onSubmit = (data: ProjectCreateInput) => {
    setError(null);

    // Submit direct data
    const submissionData = data;

    startTransition(async () => {
      try {
        const result = await createProject(organizationId, submissionData);

        if (result.success && result.project) {
          form.reset();
          setOpen(false);
          onProjectCreated({
            id: result.project.id,
            projectNumber: result.project.projectNumber,
          });
        } else {
          setError(result.error || 'Failed to create project');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Project creation error:', err);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" type="button">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to use in your purchase order.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="projectNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Number *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="e.g. PROJ-001"
                        className="pl-10 uppercase"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </div>
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
                      disabled={loadingClients}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Project description..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
