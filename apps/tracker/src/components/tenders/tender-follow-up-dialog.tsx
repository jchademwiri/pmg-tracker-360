'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, PhoneCall, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toSASTDateString, parseDateToUTC } from '@/lib/timezone';

const FollowUpSchema = z.object({
  followUpDate: z.coerce.date({ required_error: 'Follow-up date is required' }),
  contactPerson: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  nextFollowUpDate: z.coerce.date().optional().nullable(),
});

type FollowUpInput = z.infer<typeof FollowUpSchema>;

interface TenderFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderNumber: string;
  onSubmit: (data: FollowUpInput) => void;
  isPending?: boolean;
}

export function TenderFollowUpDialog({
  open,
  onOpenChange,
  tenderNumber,
  onSubmit,
  isPending: externalIsPending,
}: TenderFollowUpDialogProps) {
  const [internalIsPending, startTransition] = useTransition();
  const isPending = externalIsPending || internalIsPending;

  const form = useForm<FollowUpInput>({
    resolver: zodResolver(FollowUpSchema),
    defaultValues: {
      followUpDate: new Date(),
      contactPerson: '',
      notes: '',
      outcome: '',
      nextFollowUpDate: null,
    },
  });

  const handleFormSubmit = (data: FollowUpInput) => {
    startTransition(() => {
      onSubmit(data);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isPending) {
        onOpenChange(val);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <PhoneCall className="h-5 w-5 text-blue-500" />
            Log Tender Follow-up
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record a follow-up conversation or qualification milestone for Tender <span className="font-semibold text-foreground">{tenderNumber.toUpperCase()}</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(handleFormSubmit)(e);
            }}
            className="space-y-4 pt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Follow-up Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          className="pl-10"
                          disabled={isPending}
                          value={toSASTDateString(field.value)}
                          onChange={(e) => {
                            field.onChange(parseDateToUTC(e.target.value));
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
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Contact Person</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Name of official"
                          className="pl-10"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Conversation Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was discussed? Any feedback or instructions?"
                      className="min-h-[80px]"
                      disabled={isPending}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Outcome / Actions (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Awaiting spec changes, promised update date"
                      disabled={isPending}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextFollowUpDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Schedule Next Follow-up (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="date"
                        className="pl-10"
                        disabled={isPending}
                        value={toSASTDateString(field.value)}
                        onChange={(e) => {
                          field.onChange(parseDateToUTC(e.target.value));
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                type="button"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Follow-up
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
