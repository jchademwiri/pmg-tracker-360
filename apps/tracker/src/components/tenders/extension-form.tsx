'use client';

import { useState, useTransition } from 'react';
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
import { createTenderExtension } from '@/server/modules/extensions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
// import { useToast } from '@/hook/use-toast'; // Removed

const extensionFormSchema = z.object({
  extensionDate: z.string().min(1, 'Extension date is required'),
  newEvaluationDate: z.string().min(1, 'New evaluation date is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  file: z.any().optional(), // File handling is manual usually or via ref
});

type ExtensionFormValues = z.infer<typeof extensionFormSchema>;

interface ExtensionFormProps {
  organizationId: string;
  tenderId: string;
}

export function ExtensionForm({
  organizationId,
  tenderId,
}: ExtensionFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  // const { toast } = useToast(); // Removed

  const form = useForm<ExtensionFormValues>({
    resolver: zodResolver(extensionFormSchema),
    defaultValues: {
      extensionDate: '',
      newEvaluationDate: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
    },
  });

  const onSubmit = async (data: ExtensionFormValues) => {
    // Validate file
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      toast.error('File Required', {
        description: 'Please upload the extension letter.',
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const input = {
        tenderId,
        extensionDate: data.extensionDate,
        newEvaluationDate: data.newEvaluationDate,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
      };

      const result = await createTenderExtension(
        organizationId,
        input,
        formData
      );

      if (result.success) {
        toast.success('Success', {
          description: 'Tender extension created successfully.',
        });
        setOpen(false);
        form.reset();
        router.refresh(); // Refresh to show new extension in list and updated tender date
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to create extension.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Extension
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Tender Extension</DialogTitle>
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
              <FormLabel>Extension Letter *</FormLabel>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                className="cursor-pointer"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Extension
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
