"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  User,
  PhoneCall,
  Loader2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toSASTDateString, parseDateToUTC } from "@/lib/timezone";

const FollowUpSchema = z.object({
  followUpDate: z.coerce.date({ required_error: "Follow-up date is required" }),
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
      contactPerson: "",
      notes: "",
      outcome: "",
      nextFollowUpDate: null,
    },
  });

  const handleFormSubmit = (data: FollowUpInput) => {
    startTransition(() => {
      onSubmit(data);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isPending) {
          onOpenChange(val);
        }
      }}
    >
      <DialogContent className="sm:max-w-[720px] md:max-w-[780px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
            <PhoneCall className="h-5 w-5 text-blue-500" />
            Log Tender Follow-up
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
            Record a follow-up conversation or status query for Tender{" "}
            <span className="font-bold text-foreground">
              {tenderNumber.toUpperCase()}
            </span>
            .
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      Follow-up Date *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          className="pl-10 text-xs sm:text-sm"
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
                name="nextFollowUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      Next Follow-up Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          className="pl-10 text-xs sm:text-sm"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      Client Contact Person
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="e.g. John Doe (Procurement Officer)"
                          className="pl-10 text-xs sm:text-sm"
                          disabled={isPending}
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
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
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      Outcome / Status Headline
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="e.g. Under technical BEC evaluation"
                          className="pl-10 text-xs sm:text-sm"
                          disabled={isPending}
                          {...field}
                          value={field.value || ""}
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
                  <FormLabel className="text-xs sm:text-sm font-semibold">
                    Discussion Notes & Feedback
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed notes from the call, email correspondence, or meeting with the client regarding validity, clarifications, or award timeline..."
                      className="min-h-[110px] text-xs sm:text-sm leading-relaxed"
                      disabled={isPending}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t">
              <Button
                variant="outline"
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold h-9 px-4"
              >
                {isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Save Follow-up Entry
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
