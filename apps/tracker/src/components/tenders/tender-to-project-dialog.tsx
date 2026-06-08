'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';

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
import { toLocalDateString, fromLocalDateString } from '@/lib/tender-utils';

const ContractDetailsSchema = z.object({
  awardValue: z.string().optional().nullable(),
  contractStartDate: z.coerce.date().optional().nullable(),
  contractEndDate: z.coerce.date().optional().nullable(),
  signedContractUrl: z.string().optional().nullable(),
});

type ContractDetailsInput = z.infer<typeof ContractDetailsSchema>;

interface TenderToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderNumber: string;
  estimatedValue: string | null;
  onSubmit: (data: ContractDetailsInput) => void;
  isPending?: boolean;
}

export function TenderToProjectDialog({
  open,
  onOpenChange,
  tenderNumber,
  estimatedValue,
  onSubmit,
  isPending: externalIsPending,
}: TenderToProjectDialogProps) {
  const [internalIsPending, startTransition] = useTransition();
  const isPending = externalIsPending || internalIsPending;

  const form = useForm<ContractDetailsInput>({
    resolver: zodResolver(ContractDetailsSchema),
    defaultValues: {
      awardValue: estimatedValue || '',
      contractStartDate: null,
      contractEndDate: null,
      signedContractUrl: '',
    },
  });

  const handleFormSubmit = (data: ContractDetailsInput) => {
    startTransition(() => {
      onSubmit({
        awardValue: data.awardValue || null,
        contractStartDate: data.contractStartDate || null,
        contractEndDate: data.contractEndDate || null,
        signedContractUrl: data.signedContractUrl || null,
      });
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
            <FileText className="h-5 w-5 text-amber-500" />
            Contract Award Details
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill in the final contract details to convert Tender <span className="font-semibold text-foreground">{tenderNumber.toUpperCase()}</span> into an active Project.
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
              name="awardValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Final Award Value (ZAR)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm font-medium">
                        R
                      </span>
                      <Input
                        placeholder="0.00"
                        className="pl-8"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Contract Start Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          className="pl-10"
                          disabled={isPending}
                          value={toLocalDateString(field.value)}
                          onChange={(e) => {
                            field.onChange(fromLocalDateString(e.target.value));
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
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Contract End Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          className="pl-10"
                          disabled={isPending}
                          value={toLocalDateString(field.value)}
                          onChange={(e) => {
                            field.onChange(fromLocalDateString(e.target.value));
                          }}
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
              name="signedContractUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Signed SLA / Contract Reference</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="e.g. SLA document reference or URL"
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
                className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Award & Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
