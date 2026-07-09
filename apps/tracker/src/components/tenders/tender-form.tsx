'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';
import { StepIndicator, StepActions, type StepConfig } from '@/components/ui/form-stepper';
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

import { createTender, updateTender } from '@/server/tenders';
import { getClients } from '@/server/clients';
import {
  fromLocalDateString,
  fromLocalDateTimeString,
  toLocalDateString,
  toLocalDateTimeString,
} from '@/lib/tender-utils';
import { toSASTDateTimeString, parseDateTimeToUTC } from '@/lib/timezone';
import { sanitizeTenderNumber } from '@/lib/tender-utils';
import {
  TenderCreateSchema,
  type TenderCreateInput,
} from '@/lib/validations/tender';
import { FileUploader } from '@/components/ui/file-uploader';
import { uploadDocument } from '@/server/documents';
import { ClientCreateDialog } from '@/components/clients/client-create-dialog';

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
  mode: 'create' | 'edit';
}

export function TenderForm({ organizationId, tender, mode }: TenderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [validityType, setValidityType] = useState<'days' | 'date'>(
    tender?.validityDays ? 'days' : (tender?.validityDate ? 'date' : 'days')
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasDraft, setHasDraft] = useState(false);

  const steps: StepConfig[] = [
    { step: 1, label: 'General & Contact' },
    { step: 2, label: 'Timeline & Value' },
    { step: 3, label: 'Documents' },
  ];

  const form = useForm<TenderCreateInput>({
    resolver: zodResolver(TenderCreateSchema) as any,
    defaultValues: {
      tenderNumber: tender?.tenderNumber || '',
      description: tender?.description || '',
      clientId: tender?.client?.id || '',
      submissionDate: tender?.submissionDate || undefined,
      value: tender?.value || '',
      validityDays: tender?.validityDays || undefined,
      validityDate: tender?.validityDate || undefined,
      contactName: tender?.contactName || '',
      contactEmail: tender?.contactEmail || '',
      contactPhone: tender?.contactPhone || '',
      briefingDate: tender?.briefingDate || undefined,
      briefingLocation: tender?.briefingLocation || '',
      isBriefingMandatory: tender?.isBriefingMandatory || false,
      briefingAttended: tender?.briefingAttended || false,
      status:
        (tender?.status as
          | 'open'
          | 'closed'
          | 'evaluation'
          | 'awarded'
          | 'lost'
          | 'cancelled') || 'open',
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

  // Draft loading checks
  useEffect(() => {
    if (mode === 'create') {
      const draft = localStorage.getItem(`tender_draft_${organizationId}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          const hasData = Object.entries(parsed.values || {}).some(
            ([key, val]) => key !== 'status' && val !== '' && val !== undefined && val !== false
          );
          if (hasData) {
            setHasDraft(true);
          }
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }, [mode, organizationId]);

  // Draft autosaving logic
  const formValues = form.watch();
  useEffect(() => {
    if (mode === 'create') {
      const draftData = {
        values: formValues,
        validityType,
      };
      localStorage.setItem(`tender_draft_${organizationId}`, JSON.stringify(draftData));
    }
  }, [formValues, validityType, mode, organizationId]);

  const handleRestoreDraft = () => {
    const draft = localStorage.getItem(`tender_draft_${organizationId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.values) {
          Object.entries(parsed.values).forEach(([key, val]) => {
            if ((key === 'submissionDate' || key === 'validityDate' || key === 'briefingDate') && val) {
              form.setValue(key as any, new Date(val as string));
            } else {
              form.setValue(key as any, val);
            }
          });
        }
        if (parsed.validityType) {
          setValidityType(parsed.validityType);
        }
        toast.success('Draft restored successfully');
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
    setHasDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(`tender_draft_${organizationId}`);
    setHasDraft(false);
    toast.success('Draft discarded');
  };

  const onSubmit = (data: TenderCreateInput) => {
    setError(null);

    if (validityType === 'days' && data.validityDays && !data.submissionDate) {
      form.setError('submissionDate', {
        type: 'manual',
        message: 'Closing Date is required to calculate validity in days',
      });
      return;
    }

    const payload = {
      ...data,
      validityDays: validityType === 'days' ? data.validityDays : null,
      validityDate: validityType === 'date' ? data.validityDate : null,
    };

    startTransition(async () => {
      try {
        let result;

        if (mode === 'create') {
          result = await createTender(organizationId, payload);
        } else if (tender) {
          result = await updateTender(organizationId, tender.id, payload);
        }

        if (result?.success) {
          localStorage.removeItem(`tender_draft_${organizationId}`);

          // Upload files if any
          if (files.length > 0) {
            const entityId = mode === 'create' ? result.tender?.id : tender?.id;

            if (entityId) {
              await Promise.all(
                files.map(async (file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  await uploadDocument(organizationId, formData, {
                    tenderId: entityId,
                  });
                })
              );
            }
          }

          if (data.status === 'awarded' && result.projectId) {
            router.push(`/projects/${result.projectId}/edit`);
          } else {
            router.push('/tenders');
          }
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
            {mode === 'create' ? 'Add New Tender' : 'Edit Tender'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create'
              ? 'Create a new tender with client and submission details'
              : 'Update tender information and details'}
          </p>
        </div>
      </div>

      {/* Stepper Progress */}
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={async (step) => {
          if (step < currentStep) {
            setCurrentStep(step);
          } else if (step === 2 && currentStep === 1) {
            const isValid = await form.trigger(['tenderNumber', 'clientId']);
            if (isValid) setCurrentStep(2);
          } else if (step === 3 && currentStep === 2) {
            const isValid = await form.trigger(['tenderNumber', 'clientId']);
            if (isValid) setCurrentStep(3);
          }
        }}
      />

      {/* Draft Notification Banner */}
      {hasDraft && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-blue-400">Draft Found</span>
            <span className="text-xs text-muted-foreground">You have an unsaved draft from your last session.</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="text-xs cursor-pointer"
              onClick={handleDiscardDraft}
            >
              Discard
            </Button>
            <Button
              variant="default"
              size="sm"
              type="button"
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
              onClick={handleRestoreDraft}
            >
              Restore Draft
            </Button>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {/* STEP 1: General & Contact Info */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-200">
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
                    name="tenderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tender Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter unique tender number"
                            {...field}
                            onChange={(e) => {
                              const sanitized = sanitizeTenderNumber(e.target.value);
                              field.onChange(sanitized);
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
                        <FormLabel>Client *</FormLabel>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPending || loadingClients}
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
                                    <div className="flex flex-col">
                                      <span>{client.name}</span>
                                    </div>
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
                              form.setValue('clientId', newClient.id, {
                                shouldValidate: true,
                              });
                            }}
                          />
                        </div>
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
                            <SelectItem value="new">Opportunity</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="approved_to_prepare">Approved to Prepare</SelectItem>
                            <SelectItem value="preparation">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="evaluation">Evaluation</SelectItem>
                            <SelectItem value="awarded">Appointed / Awarded</SelectItem>
                            <SelectItem value="lost">Rejected / Lost</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
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
                            placeholder="Enter tender description..."
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

              {/* Tender Follow-up Contact */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2 text-amber-600" />
                    Tender Follow-up Contact
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tender-specific enquiry or validity follow-up details
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="e.g. Supply Chain Officer"
                              className="pl-10 rounded-md"
                              {...field}
                              value={field.value || ''}
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
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              type="email"
                              placeholder="e.g. enquiries@client.co.za"
                              className="pl-10 rounded-md"
                              {...field}
                              value={field.value || ''}
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              type="tel"
                              placeholder="e.g. +27 11 555 0123"
                              className="pl-10 rounded-md"
                              {...field}
                              value={field.value || ''}
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

          {/* STEP 2: Timeline & Value */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-200">
              {/* Submission Details */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    Submission Details
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Financial and timeline information (optional)
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormField
                    control={form.control}
                    name="submissionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Closing Date & Time</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              type="datetime-local"
                              className="pl-10 rounded-md"
                              {...field}
                              value={toLocalDateTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(
                                  fromLocalDateTimeString(e.target.value)
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

                  <div className="space-y-3">
                    <FormLabel>Tender Validity *</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={validityType === 'days' ? 'default' : 'outline'}
                        onClick={() => {
                          setValidityType('days');
                          form.setValue('validityDate', undefined);
                        }}
                        className="flex-1"
                        disabled={isPending}
                      >
                        In Days
                      </Button>
                      <Button
                        type="button"
                        variant={validityType === 'date' ? 'default' : 'outline'}
                        onClick={() => {
                          setValidityType('date');
                          form.setValue('validityDays', undefined);
                        }}
                        className="flex-1"
                        disabled={isPending}
                      >
                        Specific Date
                      </Button>
                    </div>

                    {validityType === 'days' ? (
                      <FormField
                        control={form.control}
                        name="validityDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter number of days (e.g. 90)"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                  field.onChange(val);
                                }}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="validityDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  type="date"
                                  className="pl-10 rounded-md"
                                  {...field}
                                  value={toLocalDateString(field.value)}
                                  onChange={(e) => {
                                    field.onChange(fromLocalDateString(e.target.value));
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

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tender Value</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                              R
                            </span>
                            <Input
                              type="text"
                              placeholder="Enter tender value"
                              className="pl-10 rounded-md"
                              {...field}
                              value={field.value || ''}
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </CardContent>
              </Card>

              {/* Clarification & Briefing Session */}
              <Card className="backdrop-blur-md bg-card/70 border-border/40 shadow-sm mt-6 lg:mt-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                    Clarification Meeting & Briefing Session
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clarification meeting schedule and mandatory attendance tracking
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="briefingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Briefing Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="rounded-md"
                              {...field}
                              value={toSASTDateTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(parseDateTimeToUTC(e.target.value));
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
                          <FormLabel>Venue / Meeting Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Boardroom A or Microsoft Teams link"
                              className="rounded-md"
                              {...field}
                              value={field.value || ''}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-t pt-4">
                    <FormField
                      control={form.control}
                      name="isBriefingMandatory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background/50 flex-1">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={field.value || false}
                              onChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-semibold text-sm">
                              Mandatory Briefing
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Attendance is compulsory for bid validity
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="briefingAttended"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background/50 flex-1">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={field.value || false}
                              onChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-semibold text-sm">
                              Briefing Attended
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Clarification register signed/attended
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

          {/* STEP 3: Documents */}
          {currentStep === 3 && (
            <Card className="shadow-sm animate-in fade-in duration-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Documents
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload tender documents, specifications, or requirements (PDF,
                  Word, Excel, Images)
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  maxFiles={5}
                  disabled={isPending}
                />
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <StepActions
            onCancel={handleCancel}
            onPrevious={() => setCurrentStep((prev) => prev - 1)}
            onNext={async () => {
              let fieldsToValidate: Array<keyof TenderCreateInput> = [];
              if (currentStep === 1) {
                fieldsToValidate = ['tenderNumber', 'clientId'];
              }
              const isValid = await form.trigger(fieldsToValidate);
              if (isValid) {
                setCurrentStep((prev) => prev + 1);
              }
            }}
            currentStep={currentStep}
            totalSteps={steps.length}
            isPending={isPending}
            submitLabel={mode === 'create' ? 'Create Tender' : 'Save Changes'}
            loadingLabel="Saving..."
          />
        </form>
      </Form>
    </div>
  );
}
