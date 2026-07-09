'use client';

import { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
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
import { Plus, Loader2, Upload } from 'lucide-react';
import { createTenderExtension, updateTenderExtension } from '@/server/modules/extensions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';

const extensionFormSchema = z.object({
  extensionDate: z.string().min(1, 'Extension date is required'),
  newEvaluationDate: z.string().min(1, 'New evaluation date is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  file: z.any().optional(),
});

type ExtensionFormValues = z.infer<typeof extensionFormSchema>;

export interface EditableExtension {
  id: string;
  extensionDate: Date;
  newEvaluationDate: Date;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  documents: { id: string; name: string }[];
}

interface ExtensionFormProps {
  organizationId: string;
  tenderId: string;
  /** If provided, the form opens in edit mode for this extension */
  extension?: EditableExtension;
  /** Controlled open state for edit mode */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger button variant for edit mode */
  trigger?: React.ReactNode;
}

function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function ExtensionForm({
  organizationId,
  tenderId,
  extension,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: ExtensionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isEdit = !!extension;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExtensionFormValues>({
    resolver: zodResolver(extensionFormSchema),
    defaultValues: {
      extensionDate: extension ? toDateInputValue(extension.extensionDate) : '',
      newEvaluationDate: extension ? toDateInputValue(extension.newEvaluationDate) : '',
      contactName: extension?.contactName || '',
      contactEmail: extension?.contactEmail || '',
      contactPhone: extension?.contactPhone || '',
      notes: extension?.notes || '',
    },
  });

  const onSubmit = async (data: ExtensionFormValues) => {
    const file = fileInputRef.current?.files?.[0];

    if (!isEdit && !file) {
      toast.error('File Required', {
        description: 'Please upload the extension letter.',
      });
      return;
    }

    startTransition(async () => {
      const formData = file ? new FormData() : undefined;
      if (file && formData) {
        formData.append('file', file);
      }

      if (isEdit && extension) {
        const input = {
          extensionId: extension.id,
          extensionDate: data.extensionDate,
          newEvaluationDate: data.newEvaluationDate,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          notes: data.notes,
        };

        const result = await updateTenderExtension(organizationId, input, formData);
        if (result.success) {
          toast.success('Extension updated successfully');
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to update extension');
        }
      } else {
        const input = {
          tenderId,
          extensionDate: data.extensionDate,
          newEvaluationDate: data.newEvaluationDate,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          notes: data.notes,
        };

        const result = await createTenderExtension(organizationId, input, formData!);
        if (result.success) {
          toast.success('Tender extension created successfully');
          setOpen(false);
          form.reset();
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to create extension');
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Extension
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tender Extension' : 'Add Tender Extension'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="extensionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newEvaluationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Evaluation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm text-gray-500">
                Contact Details
              </h4>
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmed By (Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+27 12 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional context..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Extension Letter {isEdit ? '(optional — new file replaces existing)' : '*'}</FormLabel>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                className="cursor-pointer"
                ref={fileInputRef}
                required={!isEdit}
              />
              {isEdit && extension?.documents?.[0] && (
                <p className="text-xs text-muted-foreground">
                  Current file: {extension.documents[0].name}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Extension' : 'Save Extension'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
