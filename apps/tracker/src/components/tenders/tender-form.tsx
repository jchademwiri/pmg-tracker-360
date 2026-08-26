"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  MapPin,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import {
  StepIndicator,
  StepActions,
  type StepConfig,
} from "@/components/ui/form-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createTender, updateTender } from "@/server/tenders";
import { getClients } from "@/server/clients";
import {
  fromLocalDateString,
  fromLocalDateTimeString,
  toLocalDateString,
  toLocalDateTimeString,
} from "@/lib/tender-utils";
import { toSASTDateTimeString, parseDateTimeToUTC } from "@/lib/timezone";
import { sanitizeTenderNumber } from "@/lib/tender-utils";
import {
  TenderCreateSchema,
  type TenderCreateInput,
} from "@/lib/validations/tender";
import { FileUploader } from "@/components/ui/file-uploader";
import { uploadDocument } from "@/server/documents";
import { ClientCreateDialog } from "@/components/clients/client-create-dialog";
import { formatDate as sharedFormatDate } from "@/lib/format";
import { ContactAutocomplete } from "@/components/common/contact-autocomplete";

interface TenderWithClient {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  status: string;
  validityDays: number | null;
  validityDate: Date | null;
  evaluationDate: Date | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  briefingDate?: Date | null;
  briefingLocation?: string | null;
  isBriefingMandatory?: boolean;
  briefingAttended?: boolean;
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
  mode: "create" | "edit";
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: {
    label: "Opportunity",
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  review: {
    label: "In Review",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  approved_to_prepare: {
    label: "Approved to Prepare",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  preparation: {
    label: "Preparing",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  ready: {
    label: "Ready for Submission",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  open: {
    label: "Open",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  submitted: {
    label: "Submitted",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  evaluation: {
    label: "In Evaluation",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  awarded: {
    label: "Appointed / Won",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  lost: {
    label: "Rejected / Lost",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  closed: {
    label: "Closed",
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export function TenderForm({ organizationId, tender, mode }: TenderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [validityType, setValidityType] = useState<"days" | "date">(
    tender?.validityDays ? "days" : tender?.validityDate ? "date" : "days",
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasDraft, setHasDraft] = useState(false);

  const steps: StepConfig[] = [
    { step: 1, label: "General & Contact" },
    { step: 2, label: "Timeline & Value" },
    { step: 3, label: "Documents" },
  ];

  const form = useForm<TenderCreateInput>({
    resolver: zodResolver(TenderCreateSchema) as any,
    defaultValues: {
      tenderNumber: tender?.tenderNumber || "",
      description: tender?.description || "",
      clientId: tender?.client?.id || "",
      submissionDate: tender?.submissionDate || undefined,
      value: tender?.value || "",
      validityDays: tender?.validityDays || undefined,
      validityDate: tender?.validityDate || undefined,
      contactName: tender?.contactName || "",
      contactEmail: tender?.contactEmail || "",
      contactPhone: tender?.contactPhone || "",
      briefingDate: tender?.briefingDate || undefined,
      briefingLocation: tender?.briefingLocation || "",
      isBriefingMandatory: tender?.isBriefingMandatory || false,
      briefingAttended: tender?.briefingAttended || false,
      status:
        (tender?.status as
          | "new"
          | "review"
          | "approved_to_prepare"
          | "preparation"
          | "ready"
          | "open"
          | "closed"
          | "evaluation"
          | "awarded"
          | "lost"
          | "cancelled") || "new",
    },
  });

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const result = await getClients(organizationId, "", 1, 100);
        setClients(result.clients);
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [organizationId]);

  // Draft loading checks for create mode
  useEffect(() => {
    if (mode === "create") {
      const draft = localStorage.getItem(`tender_draft_${organizationId}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const hasData = Object.entries(parsed.values || {}).some(
            ([key, val]) =>
              key !== "status" &&
              val !== "" &&
              val !== undefined &&
              val !== false,
          );
          if (hasData) {
            setHasDraft(true);
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [mode, organizationId]);

  // Draft autosaving logic
  const formValues = form.watch();
  useEffect(() => {
    if (mode === "create") {
      const draftData = {
        values: formValues,
        validityType,
      };
      localStorage.setItem(
        `tender_draft_${organizationId}`,
        JSON.stringify(draftData),
      );
    }
  }, [formValues, validityType, mode, organizationId]);

  const handleRestoreDraft = () => {
    const draft = localStorage.getItem(`tender_draft_${organizationId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.values) {
          Object.entries(parsed.values).forEach(([key, val]) => {
            if (
              (key === "submissionDate" ||
                key === "validityDate" ||
                key === "briefingDate") &&
              val
            ) {
              form.setValue(key as any, new Date(val as string));
            } else {
              form.setValue(key as any, val);
            }
          });
        }
        if (parsed.validityType) {
          setValidityType(parsed.validityType);
        }
        toast.success("Draft restored successfully");
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
    setHasDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(`tender_draft_${organizationId}`);
    setHasDraft(false);
    toast.success("Draft discarded");
  };

  // Selected client object
  const selectedClientId = form.watch("clientId");
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Live computed validity expiry date
  const watchedSubmissionDate = form.watch("submissionDate");
  const watchedValidityDays = form.watch("validityDays");
  const calculatedExpiryDate = useMemo(() => {
    if (
      validityType === "days" &&
      watchedSubmissionDate &&
      watchedValidityDays
    ) {
      const days = Number(watchedValidityDays);
      if (!isNaN(days) && days > 0) {
        const date = new Date(watchedSubmissionDate);
        date.setDate(date.getDate() + days);
        return date;
      }
    }
    return null;
  }, [validityType, watchedSubmissionDate, watchedValidityDays]);

  const onSubmit = (data: TenderCreateInput) => {
    setError(null);

    if (validityType === "days" && data.validityDays && !data.submissionDate) {
      form.setError("submissionDate", {
        type: "manual",
        message: "Closing Date is required to calculate validity in days",
      });
      return;
    }

    const payload = {
      ...data,
      validityDays: validityType === "days" ? data.validityDays : null,
      validityDate: validityType === "date" ? data.validityDate : null,
    };

    startTransition(async () => {
      try {
        let result;

        if (mode === "create") {
          result = await createTender(organizationId, payload);
        } else if (tender) {
          result = await updateTender(organizationId, tender.id, payload);
        }

        if (result?.success) {
          localStorage.removeItem(`tender_draft_${organizationId}`);

          // Upload files if any
          if (files.length > 0) {
            const entityId = mode === "create" ? result.tender?.id : tender?.id;

            if (entityId) {
              const uploadResults = await Promise.all(
                files.map(async (file) => {
                  const formData = new FormData();
                  formData.append("file", file);
                  return await uploadDocument(organizationId, formData, {
                    tenderId: entityId,
                  });
                }),
              );

              const failedUploads = uploadResults.filter((res) => !res.success);
              if (failedUploads.length > 0) {
                toast.warning(
                  `Tender saved, but ${failedUploads.length} attachment(s) failed to upload: ${failedUploads[0].error || "Upload error"}`,
                );
              }
            }
          }

          toast.success(
            mode === "create"
              ? "Tender created successfully"
              : "Tender updated successfully",
          );

          if (data.status === "awarded" && result.projectId) {
            router.push(`/projects/${result.projectId}/edit`);
          } else if (mode === "edit" && tender?.id) {
            router.push(`/tenders/${tender.id}`);
          } else {
            router.push("/tenders");
          }
          router.refresh();
        } else {
          setError(result?.error || "An error occurred");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Form submission error:", err);
      }
    });
  };

  const handleCancel = () => {
    if (mode === "edit" && tender?.id) {
      router.push(`/tenders/${tender.id}`);
    } else {
      router.back();
    }
  };

  const currentStatusConfig =
    STATUS_LABELS[tender?.status || "new"] || STATUS_LABELS.new;

  return (
    <div className="w-full max-w-none space-y-6 pb-6">
      {/* ── 1. Top Header Workspace Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="cursor-pointer h-9 px-3 rounded-lg text-xs"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {mode === "edit" ? "Back to Details" : "Back"}
          </Button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {mode === "create" ? "Create New Tender" : "Edit Tender"}
              </h1>
              {mode === "edit" && tender && (
                <>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold px-2.5 py-0.5"
                  >
                    {tender.tenderNumber.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 ${currentStatusConfig.color}`}
                  >
                    {currentStatusConfig.label}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {mode === "create"
                ? "Register a new tender opportunity with client details, timelines, and specifications"
                : "Modify tender parameters, client organization, deadlines, and documentation"}
            </p>
          </div>
        </div>

        {mode === "edit" && tender?.id && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/tenders/${tender.id}`)}
              className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer h-8"
            >
              View Detailed View
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        )}
      </div>

      {/* ── 2. Modern Step Navigation Rail ── */}
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={async (step) => {
          // Allow going backward without validation
          if (step < currentStep) {
            setCurrentStep(step);
            return;
          }
          // Validate step 1 before advancing to step 2+
          if (currentStep === 1 && step >= 2) {
            const isValid = await form.trigger(["tenderNumber", "clientId"]);
            if (!isValid) return;
          }
          // Validate step 2 before advancing to step 3
          if (currentStep === 2 && step === 3) {
            const isValid = await form.trigger(["submissionDate", "value"]);
            if (!isValid) return;
          }
          setCurrentStep(step);
        }}
      />

      {/* Draft Notification Banner (Create Mode) */}
      {hasDraft && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-xs sm:text-sm text-blue-600 dark:text-blue-400 block">
                Unsaved Draft Available
              </span>
              <span className="text-xs text-muted-foreground">
                You have saved form data from your previous session. Would you
                like to restore it?
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="text-xs cursor-pointer h-8"
              onClick={handleDiscardDraft}
            >
              Discard
            </Button>
            <Button
              variant="default"
              size="sm"
              type="button"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer h-8"
              onClick={handleRestoreDraft}
            >
              Restore Draft
            </Button>
          </div>
        </div>
      )}

      {/* ── 3. Main Form Container ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-destructive text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 1: General & Contact Info
             ══════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Card 1: Basic Information & Client */}
              <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Basic Tender Information
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Assign a unique tender reference and link the client
                    organization
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <FormField
                    control={form.control}
                    name="tenderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tender Reference Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. MWP-1029-TX"
                            {...field}
                            onChange={(e) => {
                              const sanitized = sanitizeTenderNumber(
                                e.target.value,
                              );
                              field.onChange(sanitized);
                            }}
                            disabled={isPending}
                            className="font-mono uppercase text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Client Selector with Quick Create Action */}
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Client Organization *
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPending || loadingClients}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full text-xs sm:text-sm">
                                <SelectValue placeholder="Select a client organization..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loadingClients ? (
                                <SelectItem value="loading" disabled>
                                  Loading clients...
                                </SelectItem>
                              ) : clients.length === 0 ? (
                                <SelectItem value="no-clients" disabled>
                                  No clients registered yet
                                </SelectItem>
                              ) : (
                                clients.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
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
                              form.setValue("clientId", newClient.id, {
                                shouldValidate: true,
                              });
                            }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Inline Client Card Snapshot */}
                  {selectedClient && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <Building className="h-3.5 w-3.5 text-blue-600" />
                        <span>{selectedClient.name}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-border/40">
                        {selectedClient.contactName && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground/60" />
                            <span>{selectedClient.contactName}</span>
                          </div>
                        )}
                        {selectedClient.contactEmail && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 text-muted-foreground/60" />
                            <span className="truncate">
                              {selectedClient.contactEmail}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Dropdown */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Lifecycle Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="text-xs sm:text-sm">
                              <SelectValue placeholder="Select current status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Opportunity</SelectItem>
                            <SelectItem value="review">In Review</SelectItem>
                            <SelectItem value="approved_to_prepare">
                              Approved to Prepare
                            </SelectItem>
                            <SelectItem value="preparation">
                              Preparing Bid
                            </SelectItem>
                            <SelectItem value="ready">
                              Ready for Submission
                            </SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="evaluation">
                              In Evaluation
                            </SelectItem>
                            <SelectItem value="awarded">
                              Appointed / Awarded (Won)
                            </SelectItem>
                            <SelectItem value="lost">
                              Rejected / Lost
                            </SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Scope & Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Tender Scope & Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed scope of work, key deliverables, or project summary..."
                            rows={4}
                            {...field}
                            disabled={isPending}
                            className="text-xs sm:text-sm leading-relaxed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card 2: Tender Follow-up & Enquiry Contact */}
              <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-600" />
                    Tender Follow-up Contact
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Client procurement officer or designated enquiry focal point
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Contact Person Name
                        </FormLabel>
                        <FormControl>
                          <ContactAutocomplete
                            organizationId={organizationId}
                            clientId={form.watch("clientId") || null}
                            value={field.value || ""}
                            onChange={field.onChange}
                            onSelectContact={(contact) => {
                              form.setValue("contactName", contact.name);
                              form.setValue("contactEmail", contact.email);
                              form.setValue("contactPhone", contact.phone);
                            }}
                            placeholder="e.g. SCM Specialist / Bid Secretary"
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Enquiry Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                            <Input
                              type="email"
                              placeholder="e.g. tenders@client.gov.za"
                              className="pl-9 text-xs sm:text-sm"
                              {...field}
                              value={field.value || ""}
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
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Contact Telephone Number
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                            <Input
                              type="tel"
                              placeholder="e.g. +27 11 800 2000"
                              className="pl-9 text-xs sm:text-sm"
                              {...field}
                              value={field.value || ""}
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2: Timeline, Validity & Value
             ══════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Card 1: Closing Deadlines & Validity Calculation */}
              <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Timeline & Financial Valuation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Specify closing submission timestamp, validity parameters,
                    and estimated budget
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Closing Date */}
                  <FormField
                    control={form.control}
                    name="submissionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Submission Closing Date & Time
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                            <Input
                              type="datetime-local"
                              className="pl-9 text-xs sm:text-sm"
                              {...field}
                              value={toLocalDateTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(
                                  fromLocalDateTimeString(e.target.value),
                                );
                              }}
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Validity Toggle & Calculator */}
                  <div className="space-y-3 pt-1 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold">
                        Bid Validity Period *
                      </FormLabel>
                      <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
                        <button
                          type="button"
                          onClick={() => {
                            setValidityType("days");
                            form.setValue("validityDate", undefined);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                            validityType === "days"
                              ? "bg-background text-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          In Days
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setValidityType("date");
                            form.setValue("validityDays", undefined);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                            validityType === "date"
                              ? "bg-background text-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Specific Date
                        </button>
                      </div>
                    </div>

                    {validityType === "days" ? (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="validityDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g. 90 or 120 days"
                                  className="text-xs sm:text-sm"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ""
                                        ? ""
                                        : parseInt(e.target.value, 10);
                                    field.onChange(val);
                                  }}
                                  disabled={isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {calculatedExpiryDate && (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Computed Validity Expiry:{" "}
                              <strong>
                                {sharedFormatDate(calculatedExpiryDate)}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="validityDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                                <Input
                                  type="date"
                                  className="pl-9 text-xs sm:text-sm"
                                  {...field}
                                  value={toLocalDateString(field.value)}
                                  onChange={(e) => {
                                    field.onChange(
                                      fromLocalDateString(e.target.value),
                                    );
                                  }}
                                  disabled={isPending}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Estimated Tender Value */}
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem className="pt-1 border-t border-border/40">
                        <FormLabel className="text-xs font-semibold">
                          Estimated Tender Value (ZAR)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                              R
                            </span>
                            <Input
                              type="text"
                              placeholder="0.00"
                              className="pl-8 text-xs sm:text-sm font-medium"
                              {...field}
                              value={field.value || ""}
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card 2: Clarification Meeting & Briefing Schedule */}
              <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
                <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    Clarification Meeting & Briefing Session
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Log briefing sessions and track compulsory attendance
                    requirements
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="briefingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">
                            Briefing Date & Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="text-xs sm:text-sm"
                              {...field}
                              value={toSASTDateTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(
                                  parseDateTimeToUTC(e.target.value),
                                );
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="briefingLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">
                            Venue / Online Link
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                              <Input
                                placeholder="e.g. Teams link / HQ Room"
                                className="pl-9 text-xs sm:text-sm"
                                {...field}
                                value={field.value || ""}
                                disabled={isPending}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Attendance Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/40">
                    <FormField
                      control={form.control}
                      name="isBriefingMandatory"
                      render={({ field }) => (
                        <FormItem
                          onClick={() => field.onChange(!field.value)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            field.value
                              ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
                              : "border-border/60 hover:border-indigo-500/40 bg-card"
                          }`}
                        >
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={field.value || false}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel className="font-bold text-xs sm:text-sm text-foreground cursor-pointer block">
                              Mandatory Briefing
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Attendance is compulsory for bid compliance.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="briefingAttended"
                      render={({ field }) => (
                        <FormItem
                          onClick={() => field.onChange(!field.value)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            field.value
                              ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                              : "border-border/60 hover:border-emerald-500/40 bg-card"
                          }`}
                        >
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={field.value || false}
                              onChange={(e) => field.onChange(e.target.checked)}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel className="font-bold text-xs sm:text-sm text-foreground cursor-pointer block">
                              Briefing Attended
                            </FormLabel>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Attendance certificate or register signed.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 3: Documents & Attachments
             ══════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden animate-in fade-in duration-200">
              <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Tender Attachments & Specifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload tender documents, ITT returnables, pricing schedules,
                  or technical specifications
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  maxFiles={10}
                  disabled={isPending}
                />
              </CardContent>
            </Card>
          )}

          {/* ── 4. Form Actions Footer Bar ── */}
          <StepActions
            onCancel={handleCancel}
            onPrevious={() => setCurrentStep((prev) => prev - 1)}
            onNext={async () => {
              let fieldsToValidate: Array<keyof TenderCreateInput> = [];
              if (currentStep === 1) {
                fieldsToValidate = ["tenderNumber", "clientId"];
              } else if (currentStep === 2) {
                fieldsToValidate = ["submissionDate", "value"];
              }
              const isValid = await form.trigger(fieldsToValidate);
              if (isValid) {
                setCurrentStep((prev) => prev + 1);
              }
            }}
            currentStep={currentStep}
            totalSteps={steps.length}
            isPending={isPending}
            submitLabel={mode === "create" ? "Create Tender" : "Save Changes"}
            loadingLabel="Saving..."
          />
        </form>
      </Form>
    </div>
  );
}
