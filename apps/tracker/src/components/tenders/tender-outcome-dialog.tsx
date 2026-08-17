'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Trophy,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Building,
  CheckCircle2,
} from 'lucide-react';

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
  FormDescription,
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
import { toSASTDateString, parseDateToUTC } from '@/lib/timezone';

// ── Schema for Appointed / Awarded ──
const AwardedSchema = z.object({
  awardValue: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val.trim() === '') return null;
      const cleaned = val.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      if (isNaN(num)) return null;
      return cleaned;
    }),
  contractStartDate: z.coerce.date().optional().nullable(),
  contractEndDate: z.coerce.date().optional().nullable(),
  signedContractUrl: z.string().optional().nullable(),
  evaluationNotes: z.string().optional().nullable(),
});

type AwardedFormValues = z.input<typeof AwardedSchema>;

// ── Schema for Rejected / Lost ──
const LostSchema = z.object({
  lossReason: z.string().min(1, 'Please select the primary reason for rejection'),
  lossDetails: z.string().optional().nullable(),
  evaluationNotes: z.string().optional().nullable(),
});

type LostFormValues = z.infer<typeof LostSchema>;

interface TenderOutcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderNumber: string;
  estimatedValue: string | null;
  currentStatus: string;
  initialAwardValue?: string | null;
  initialLossReason?: string | null;
  initialLossDetails?: string | null;
  initialEvaluationNotes?: string | null;
  onAwardSubmit: (data: {
    awardValue?: string | null;
    contractStartDate?: Date | null;
    contractEndDate?: Date | null;
    signedContractUrl?: string | null;
    evaluationNotes?: string | null;
  }) => void;
  onLostSubmit: (data: {
    lossReason: string;
    lossDetails?: string | null;
    evaluationNotes?: string | null;
  }) => void;
  isPending?: boolean;
}

export function TenderOutcomeDialog({
  open,
  onOpenChange,
  tenderNumber,
  estimatedValue,
  currentStatus,
  initialAwardValue,
  initialLossReason,
  initialLossDetails,
  initialEvaluationNotes,
  onAwardSubmit,
  onLostSubmit,
  isPending: externalIsPending,
}: TenderOutcomeDialogProps) {
  const [internalIsPending, startTransition] = useTransition();
  const isPending = externalIsPending || internalIsPending;

  // Selected outcome mode: 'awarded' or 'lost'
  const [outcomeMode, setOutcomeMode] = useState<'awarded' | 'lost'>(
    currentStatus === 'lost' ? 'lost' : 'awarded'
  );

  // Form for Awarded
  const awardForm = useForm<AwardedFormValues>({
    resolver: zodResolver(AwardedSchema),
    defaultValues: {
      awardValue: initialAwardValue || estimatedValue || '',
      contractStartDate: null,
      contractEndDate: null,
      signedContractUrl: '',
      evaluationNotes: initialEvaluationNotes || '',
    },
  });

  // Form for Lost
  const lostForm = useForm<LostFormValues>({
    resolver: zodResolver(LostSchema),
    defaultValues: {
      lossReason: initialLossReason || '',
      lossDetails: initialLossDetails || '',
      evaluationNotes: initialEvaluationNotes || '',
    },
  });

  const handleAwardSubmit = (data: AwardedFormValues) => {
    startTransition(() => {
      onAwardSubmit({
        awardValue: data.awardValue || null,
        contractStartDate: data.contractStartDate || null,
        contractEndDate: data.contractEndDate || null,
        signedContractUrl: data.signedContractUrl || null,
        evaluationNotes: data.evaluationNotes || null,
      });
    });
  };

  const handleLostSubmit = (data: LostFormValues) => {
    startTransition(() => {
      onLostSubmit({
        lossReason: data.lossReason,
        lossDetails: data.lossDetails || null,
        evaluationNotes: data.evaluationNotes || null,
      });
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
      <DialogContent className="sm:max-w-[760px] md:max-w-[820px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
            Record Tender Decision Outcome
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
            Finalize the outcome for Tender{' '}
            <span className="font-bold text-foreground">
              {tenderNumber.toUpperCase()}
            </span>
            . Select whether your submission was successfully appointed or rejected.
          </DialogDescription>
        </DialogHeader>

        {/* Outcome Selector Mode Tabs (Wider 2-Card Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Option 1: Appointed / Won */}
          <button
            type="button"
            onClick={() => setOutcomeMode('awarded')}
            disabled={isPending}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
              outcomeMode === 'awarded'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                : 'border-border/60 hover:border-emerald-500/40 bg-card'
            }`}
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base text-foreground block">Appointed (Won)</span>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Client awarded the contract. Converts tender into an active project workspace.
              </p>
            </div>
          </button>

          {/* Option 2: Rejected / Lost */}
          <button
            type="button"
            onClick={() => setOutcomeMode('lost')}
            disabled={isPending}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
              outcomeMode === 'lost'
                ? 'border-red-500 bg-red-500/10 shadow-xs'
                : 'border-border/60 hover:border-red-500/40 bg-card'
            }`}
          >
            <div className="h-9 w-9 rounded-lg bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base text-foreground block">Rejected (Lost)</span>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Unsuccessful bid. Log debrief reasons & team learnings for retrospectives.
              </p>
            </div>
          </button>
        </div>

        {/* ── MODE 1: APPOINTED / AWARDED FORM ── */}
        {outcomeMode === 'awarded' && (
          <Form {...awardForm}>
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                awardForm.handleSubmit(handleAwardSubmit)(e);
              }}
              className="space-y-4 pt-3 border-t border-border/40"
            >
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Great news! Confirming the award will initialize a project workspace for contract delivery.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={awardForm.control}
                  name="awardValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Final Award Value (ZAR)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                            R
                          </span>
                          <Input
                            placeholder="0.00"
                            className="pl-8 text-sm"
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

                <FormField
                  control={awardForm.control}
                  name="signedContractUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Signed SLA / Contract Reference</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                          <Input
                            placeholder="e.g. Contract No. / SLA document link"
                            className="pl-9 text-xs sm:text-sm"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={awardForm.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Contract Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                          <Input
                            type="date"
                            className="pl-9 text-xs sm:text-sm"
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
                  control={awardForm.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Contract End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                          <Input
                            type="date"
                            className="pl-9 text-xs sm:text-sm"
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

              <FormField
                control={awardForm.control}
                name="evaluationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Appointment Notes / Scope Highlights</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any key terms, delivery timelines, or negotiation notes..."
                        className="min-h-[85px] text-xs sm:text-sm leading-relaxed"
                        disabled={isPending}
                        {...field}
                        value={field.value || ''}
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
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold h-9 px-4"
                >
                  {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Confirm Appointment & Create Project
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* ── MODE 2: REJECTED / LOST FORM (WITH LEARNING & DEBRIEF NOTES) ── */}
        {outcomeMode === 'lost' && (
          <Form {...lostForm}>
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                lostForm.handleSubmit(handleLostSubmit)(e);
              }}
              className="space-y-4 pt-3 border-t border-border/40"
            >
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-300">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold block">Capture feedback for continuous improvement:</span>
                  <span className="text-xs text-muted-foreground">
                    Recording specific debrief notes helps our bidding team understand gaps and win future tenders.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={lostForm.control}
                  name="lossReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Primary Reason for Rejection *</FormLabel>
                      <Select
                        disabled={isPending}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-xs sm:text-sm">
                            <SelectValue placeholder="Select why this tender was lost..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="price">Pricing too high / Competitor undercut</SelectItem>
                          <SelectItem value="compliance">Compliance / Missing returnable document</SelectItem>
                          <SelectItem value="specs">Technical specifications shortfall / Non-responsive</SelectItem>
                          <SelectItem value="experience">Track record / Insufficient references</SelectItem>
                          <SelectItem value="score">Functionality threshold not met (Scorecard)</SelectItem>
                          <SelectItem value="cancelled">Tender cancelled / Re-advertised by client</SelectItem>
                          <SelectItem value="other">Other reason</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={lostForm.control}
                  name="lossDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Winning Bidder & Market Intel (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Awarded to ABC Supplies at R 1,200,000"
                          className="text-xs sm:text-sm"
                          disabled={isPending}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={lostForm.control}
                name="evaluationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">
                      Debrief Feedback & Team Lessons Learned
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter feedback received from client debrief, scorecard points breakdown, specific areas where points were deducted, and actionable steps to improve in the next tender submission..."
                        className="min-h-[120px] text-xs sm:text-sm leading-relaxed"
                        disabled={isPending}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      These notes will be displayed on the tender overview for team retrospectives and future bids.
                    </FormDescription>
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
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold h-9 px-4"
                >
                  {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Save Outcome & Log Team Learnings
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
