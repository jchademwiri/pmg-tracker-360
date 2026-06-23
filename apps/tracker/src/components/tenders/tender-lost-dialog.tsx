'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LostDetailsSchema = z.object({
  lossReason: z.string().min(1, 'Reason for loss is required'),
  lossDetails: z.string().optional().nullable(),
  evaluationNotes: z.string().optional().nullable(),
});

type LostDetailsInput = z.infer<typeof LostDetailsSchema>;

interface TenderLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderNumber: string;
  onSubmit: (data: LostDetailsInput) => void;
  isPending?: boolean;
}

export function TenderLostDialog({
  open,
  onOpenChange,
  tenderNumber,
  onSubmit,
  isPending: externalIsPending,
}: TenderLostDialogProps) {
  const [internalIsPending, startTransition] = useTransition();
  const isPending = externalIsPending || internalIsPending;

  const form = useForm<LostDetailsInput>({
    resolver: zodResolver(LostDetailsSchema),
    defaultValues: {
      lossReason: '',
      lossDetails: '',
      evaluationNotes: '',
    },
  });

  const handleFormSubmit = (data: LostDetailsInput) => {
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
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Tender Outcome: Lost
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Provide details about the outcome of Tender <span className="font-semibold text-foreground">{tenderNumber.toUpperCase()}</span>.
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
            <FormField
              control={form.control}
              name="lossReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Primary Reason for Loss</FormLabel>
                  <Select
                    disabled={isPending}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="price">Pricing too high / Competitor cheaper</SelectItem>
                      <SelectItem value="compliance">Compliance failure / Documentation issue</SelectItem>
                      <SelectItem value="specs">Technical specs mismatch</SelectItem>
                      <SelectItem value="experience">Lacked required experience/references</SelectItem>
                      <SelectItem value="cancelled">Tender cancelled by client</SelectItem>
                      <SelectItem value="other">Other reason</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lossDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Additional Details / Competitor Info</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Competitor name or award value if known"
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
              name="evaluationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Evaluation Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter feedback received, scorecard metrics, or general notes from the evaluation process."
                      className="min-h-[100px]"
                      disabled={isPending}
                      {...field}
                      value={field.value || ''}
                    />
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
                className="cursor-pointer bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Outcome & Mark as Lost
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
