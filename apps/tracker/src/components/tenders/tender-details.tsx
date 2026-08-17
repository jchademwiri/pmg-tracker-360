"use client";

import React, { useTransition, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  Plus,
  PhoneCall,
  AlertTriangle,
  Activity,
  TrendingUp,
  ClipboardCheck,
  Loader2,
  ExternalLink,
  MessageSquare,
  Clock,
  RefreshCw,
  History,
  Trophy,
  XCircle,
  Lightbulb,
  Edit,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deleteTender,
  updateTenderStatus,
  createTenderFollowUp,
  getTenderActivities,
} from "@/server/tenders";
import {
  formatCurrency,
  formatDate as sharedFormatDate,
  formatDateTime,
} from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentManager } from "@/components/documents/document-manager";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { ExtensionList, ExtendedTenderExtension } from "./extension-list";
import { TenderOutcomeDialog } from "./tender-outcome-dialog";
import { TenderFollowUpDialog } from "./tender-follow-up-dialog";
import { TenderHeroHeader } from "./tender-hero-header";
import { TenderStakeholdersCard } from "./tender-stakeholders-card";

interface TenderWithClient {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  awardValue: string | null;
  lossReason: string | null;
  lossDetails: string | null;
  evaluationNotes: string | null;
  status: string;
  evaluationDate: Date | null;
  validityDays: number | null;
  validityDate: Date | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
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

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  signedUrl?: string;
  url?: string;
}

interface FollowUp {
  id: string;
  tenderId: string;
  followUpDate: Date;
  contactPerson: string | null;
  notes: string | null;
  outcome: string | null;
  nextFollowUpDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TenderDetailsProps {
  tender: TenderWithClient;
  organizationId: string;
  documents: Document[];
  extensions: ExtendedTenderExtension[];
  followUps: FollowUp[];
}

const VALID_TABS = [
  "overview",
  "documents",
  "extensions",
  "follow-ups",
  "activities",
];

const LOSS_REASON_LABELS: Record<string, string> = {
  price: "Pricing too high / Competitor undercut",
  compliance: "Compliance / Missing returnable document",
  specs: "Technical specs shortfall / Non-responsive",
  experience: "Track record / Insufficient references",
  score: "Functionality scorecard threshold not met",
  cancelled: "Tender cancelled / Re-advertised by client",
  other: "Other reason",
};

export function TenderDetails({
  tender,
  organizationId,
  documents,
  extensions,
  followUps,
}: TenderDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Tab state synchronized with URL query params
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (activeTab === "activities") {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const result = await getTenderActivities(organizationId, tender.id);
          if (result.success && result.activities) {
            setActivities(result.activities);
          }
        } catch (error) {
          console.error("Error loading tender activities:", error);
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
    }
  }, [activeTab, tender.id, organizationId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "tender_created":
        return <Plus className="h-4 w-4 text-emerald-400" />;
      case "status_change":
        return <TrendingUp className="h-4 w-4 text-sky-400" />;
      case "extension_added":
        return <Calendar className="h-4 w-4 text-amber-400" />;
      case "follow_up_added":
        return <ClipboardCheck className="h-4 w-4 text-violet-400" />;
      default:
        return <Activity className="h-4 w-4 text-zinc-400" />;
    }
  };

  const handleFollowUpSubmit = async (data: any) => {
    startTransition(async () => {
      const result = await createTenderFollowUp(organizationId, {
        tenderId: tender.id,
        ...data,
      });
      if (result.success) {
        setShowFollowUpDialog(false);
        toast.success("Follow-up logged successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create follow-up");
      }
    });
  };

  const handleEdit = () => {
    router.push(`/tenders/${tender.id}/edit`);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    startTransition(async () => {
      const result = await deleteTender(organizationId, tender.id);
      if (result.success) {
        toast.success("Tender deleted successfully");
        setIsDeleteDialogOpen(false);
        router.push("/tenders");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete tender");
      }
    });
  };

  const handleStatusUpdate = async (
    newStatus:
      | "new"
      | "review"
      | "approved_to_prepare"
      | "preparation"
      | "ready"
      | "submitted"
      | "evaluation"
      | "awarded"
      | "lost"
      | "cancelled"
      | "closed"
      | "open",
    details?: {
      awardValue?: string | null;
      contractStartDate?: Date | null;
      contractEndDate?: Date | null;
      signedContractUrl?: string | null;
      lossReason?: string | null;
      lossDetails?: string | null;
      evaluationNotes?: string | null;
    },
  ) => {
    startTransition(async () => {
      const result = await updateTenderStatus(organizationId, tender.id, {
        status: newStatus,
        awardValue: details?.awardValue ?? null,
        contractStartDate: details?.contractStartDate,
        contractEndDate: details?.contractEndDate,
        signedContractUrl: details?.signedContractUrl,
        lossReason: details?.lossReason ?? null,
        lossDetails: details?.lossDetails ?? null,
        evaluationNotes: details?.evaluationNotes ?? null,
      });
      if (result.success) {
        toast.success(`Tender status updated to ${newStatus}`);
        if (newStatus === "awarded" && result.projectId) {
          router.push(`/projects/${result.projectId}/edit`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to update tender status");
      }
    });
  };

  const handleExportPdf = async () => {
    const toastId = toast.loading("Generating PDF...");
    try {
      const response = await fetch(`/api/tenders/${tender.id}/pdf`);
      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Tender-${tender.tenderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
      console.error("Tender PDF export failed:", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    }
  };

  const latestFollowUp = followUps.length > 0 ? followUps[0] : null;

  return (
    <div className="w-full space-y-6">
      {/* ── 1. Hero Header, Compact Lifecycle Rail & 4-Tile KPI Strip ── */}
      <TenderHeroHeader
        tender={tender}
        isPending={isPending}
        onEdit={handleEdit}
        onExportPdf={handleExportPdf}
        onDelete={handleDelete}
        onOpenOutcomeDialog={() => setShowOutcomeDialog(true)}
        onOpenFollowUpDialog={() => setShowFollowUpDialog(true)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* ── 2. Main 2-Column Responsive Workspace (Stakeholders visible across ALL tabs) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3 width on large screens) - Holds the Tabbed Interface */}
        <div className="xl:col-span-2 space-y-6 min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-px">
              <TabsList className="bg-transparent h-auto p-0 gap-2 flex-wrap">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg px-3.5 py-1.5 text-xs font-semibold"
                >
                  Overview
                </TabsTrigger>

                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg px-3.5 py-1.5 text-xs font-semibold gap-1.5"
                >
                  Documents
                  {documents.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-bold"
                    >
                      {documents.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="extensions"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg px-3.5 py-1.5 text-xs font-semibold gap-1.5"
                >
                  Extensions
                  {extensions.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-bold"
                    >
                      {extensions.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="follow-ups"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg px-3.5 py-1.5 text-xs font-semibold gap-1.5"
                >
                  Follow-ups
                  {followUps.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-bold"
                    >
                      {followUps.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="activities"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg px-3.5 py-1.5 text-xs font-semibold"
                >
                  Activities
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ── OVERVIEW TAB ── */}
            <TabsContent value="overview" className="mt-5 space-y-5">
              {/* Option A: Award / Appointment Outcome Card (if awarded) */}
              {tender.status === "awarded" && (
                <Card className="rounded-xl border-emerald-500/40 bg-emerald-500/[0.03] shadow-xs">
                  <CardHeader className="py-3 px-5 border-b border-emerald-500/20 bg-emerald-500/10 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-emerald-600" />
                      Award & Appointment Outcome (Won)
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOutcomeDialog(true)}
                      className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Award Details
                    </Button>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border border-emerald-500/20 bg-background/60">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Final Award Value
                        </span>
                        <p className="text-xl font-bold text-emerald-600 mt-0.5">
                          {formatCurrency(tender.awardValue || tender.value)}
                        </p>
                      </div>

                      {tender.value && tender.awardValue && (
                        <div className="p-3 rounded-lg border border-emerald-500/20 bg-background/60">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            Initial Estimated Value
                          </span>
                          <p className="text-lg font-semibold text-foreground mt-0.5">
                            {formatCurrency(tender.value)}
                          </p>
                        </div>
                      )}

                      {tender.evaluationNotes && (
                        <div className="sm:col-span-2 space-y-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Appointment & Scope Notes
                          </span>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap rounded-lg bg-background/60 p-3 border border-border/40 leading-relaxed">
                            {tender.evaluationNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Option B: Loss / Rejection Debrief & Team Learnings Card (if lost) */}
              {tender.status === "lost" && (
                <Card className="rounded-xl border-red-500/40 bg-red-500/[0.03] shadow-xs overflow-hidden">
                  <CardHeader className="py-3 px-5 border-b border-red-500/20 bg-red-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <CardTitle className="text-sm font-bold text-red-900 dark:text-red-300">
                        Tender Outcome: Rejected (Lost)
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOutcomeDialog(true)}
                      className="h-7 text-xs text-red-700 hover:text-red-800 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Update Debrief Notes
                    </Button>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    {/* Primary reason and intel pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border border-red-500/20 bg-background/60 space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Primary Rejection Reason
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="destructive"
                            className="text-xs font-semibold px-2 py-0.5"
                          >
                            {tender.lossReason
                              ? LOSS_REASON_LABELS[tender.lossReason] ||
                                tender.lossReason.replace("_", " ")
                              : "Not specified"}
                          </Badge>
                        </div>
                      </div>

                      {tender.lossDetails && (
                        <div className="p-3 rounded-lg border border-red-500/20 bg-background/60 space-y-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            Competitor / Market Intel
                          </span>
                          <p className="text-xs font-medium text-foreground">
                            {tender.lossDetails}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Debrief & Lessons Learned Text */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        <span>
                          Debrief Feedback & Continuous Improvement Learnings
                        </span>
                      </div>
                      {tender.evaluationNotes ? (
                        <div className="rounded-lg bg-background/80 p-3.5 border border-border/60 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {tender.evaluationNotes}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-background/40 p-3 border border-dashed border-border/60 text-xs text-muted-foreground italic flex items-center justify-between">
                          <span>
                            No debrief notes recorded yet. Record feedback from
                            the client to help the team learn.
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowOutcomeDialog(true)}
                            className="text-xs text-blue-600 h-auto p-0 ml-2"
                          >
                            + Add Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Option C: In-Progress Pending Decision Banner (if in review, ready, submitted, evaluation) */}
              {!["awarded", "lost", "closed", "cancelled"].includes(
                tender.status,
              ) && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Final Decision Pending
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Once client feedback or contract announcement is
                        received, record the outcome below.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOutcomeDialog(true)}
                      className="text-xs h-8 cursor-pointer border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                    >
                      Record Won / Lost Outcome
                    </Button>
                  </div>
                </div>
              )}

              {/* Tender Scope & Detailed Description */}
              <Card className="rounded-xl border-border/60 shadow-xs">
                <CardHeader className="py-3.5 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Tender Scope & Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {tender.description ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {tender.description}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                      <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground/30" />
                      <p className="italic">
                        No description or scope notes added for this tender.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleEdit}
                        className="text-xs text-blue-600 mt-1 cursor-pointer h-auto p-0"
                      >
                        + Add Tender Scope
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Follow-up Highlight Snapshot */}
              <Card className="rounded-xl border-border/60 shadow-xs">
                <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-violet-600" />
                    Latest Communication Snapshot
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("follow-ups")}
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 px-2 cursor-pointer"
                  >
                    View All Logs
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  {latestFollowUp ? (
                    <div className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {sharedFormatDate(latestFollowUp.followUpDate)}
                          </span>
                          {latestFollowUp.contactPerson && (
                            <span className="text-muted-foreground">
                              with{" "}
                              <span className="text-foreground font-medium">
                                {latestFollowUp.contactPerson}
                              </span>
                            </span>
                          )}
                        </div>
                        {latestFollowUp.nextFollowUpDate && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/5"
                          >
                            Next:{" "}
                            {sharedFormatDate(latestFollowUp.nextFollowUpDate)}
                          </Badge>
                        )}
                      </div>
                      {latestFollowUp.notes && (
                        <p className="text-foreground/80 whitespace-pre-wrap">
                          {latestFollowUp.notes}
                        </p>
                      )}
                      {latestFollowUp.outcome && (
                        <div className="pt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="font-semibold text-foreground">
                            Outcome:
                          </span>
                          <span>{latestFollowUp.outcome}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      <PhoneCall className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground/30" />
                      <p>No client communication logged yet.</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowFollowUpDialog(true)}
                        className="text-xs text-blue-600 mt-1 cursor-pointer h-auto p-0"
                      >
                        + Log First Follow-up
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── DOCUMENTS TAB ── */}
            <TabsContent value="documents" className="mt-5">
              <DocumentManager
                organizationId={organizationId}
                entityId={tender.id}
                entityType="tender"
                initialDocuments={documents}
              />
            </TabsContent>

            {/* ── EXTENSIONS TAB ── */}
            <TabsContent value="extensions" className="mt-5">
              <ExtensionList
                extensions={extensions}
                organizationId={organizationId}
                tenderId={tender.id}
              />
            </TabsContent>

            {/* ── FOLLOW-UPS TAB ── */}
            <TabsContent value="follow-ups" className="mt-5">
              <Card className="rounded-xl shadow-xs border border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Follow-up Log Workspace
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Keep track of all client communication and bid status
                      queries
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowFollowUpDialog(true)}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Follow-up
                  </Button>
                </CardHeader>
                <CardContent>
                  {followUps.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                      <PhoneCall className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-semibold text-sm">
                        No follow-ups logged yet
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Keep a digital trail of updates to ensure you stay
                        aligned on validities.
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-blue-500/20 pl-6 ml-3 space-y-5">
                      {followUps.map((f) => (
                        <div key={f.id} className="relative">
                          {/* Timeline dot */}
                          <span className="absolute -left-[31px] top-1 bg-background border-2 border-blue-500 rounded-full h-4 w-4 z-10 flex items-center justify-center">
                            <span className="bg-blue-500 rounded-full h-1.5 w-1.5" />
                          </span>
                          <div className="bg-card border border-border/50 hover:border-blue-500/30 p-4 rounded-xl shadow-xs transition-all duration-200">
                            <div className="flex justify-between items-start gap-4 flex-wrap">
                              <div>
                                <span className="text-xs font-semibold text-blue-600">
                                  {sharedFormatDate(f.followUpDate)}
                                </span>
                                {f.contactPerson && (
                                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                    Contact:{" "}
                                    <span className="text-foreground font-semibold">
                                      {f.contactPerson}
                                    </span>
                                  </p>
                                )}
                              </div>
                              {f.nextFollowUpDate && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-amber-600 bg-amber-500/5 border-amber-500/20"
                                >
                                  Next: {sharedFormatDate(f.nextFollowUpDate)}
                                </Badge>
                              )}
                            </div>
                            {f.notes && (
                              <p className="text-xs sm:text-sm text-foreground/90 mt-2 whitespace-pre-wrap">
                                {f.notes}
                              </p>
                            )}
                            {f.outcome && (
                              <div className="mt-2.5 flex items-start gap-1.5 bg-muted/40 p-2 rounded-lg text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground shrink-0">
                                  Outcome:
                                </span>
                                <span>{f.outcome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── ACTIVITIES TAB (With Integrated Timeline & Audit Card) ── */}
            <TabsContent value="activities" className="mt-5 space-y-5">
              {/* Integrated Timeline & Audit Milestones */}
              <Card className="rounded-xl border-border/60 shadow-xs overflow-hidden">
                <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-600" />
                    Lifecycle Milestones & Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 flex items-start gap-2.5">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-muted-foreground block text-[11px]">
                          Created
                        </span>
                        <span className="text-foreground font-semibold">
                          {formatDateTime(tender.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 flex items-start gap-2.5">
                      <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-muted-foreground block text-[11px]">
                          Last Modified
                        </span>
                        <span className="text-foreground font-semibold">
                          {formatDateTime(tender.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 flex items-start gap-2.5">
                      <Calendar className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-muted-foreground block text-[11px]">
                          Closing Timestamp
                        </span>
                        <span className="text-foreground font-semibold">
                          {tender.submissionDate
                            ? formatDateTime(tender.submissionDate)
                            : "Not specified"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/50 bg-background/50 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-muted-foreground block text-[11px]">
                          Validity Target
                        </span>
                        <span className="text-foreground font-semibold">
                          {sharedFormatDate(
                            tender.evaluationDate || tender.validityDate,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Stream */}
              <Card className="rounded-xl shadow-xs border border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold">
                    Tender Event Feed
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Chronological audit log of all status transitions,
                    follow-ups, and extensions
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-8">
                  {loadingActivities ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-border space-y-6 mt-2">
                      {activities.map((act) => (
                        <div key={act.id} className="relative group">
                          <div className="absolute -left-[31px] top-0.5 p-1 bg-background border-2 border-border rounded-full group-hover:border-blue-500 transition-colors duration-200">
                            {getActivityIcon(act.activityType)}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">
                                {sharedFormatDate(act.createdAt)} •{" "}
                                {new Date(act.createdAt).toLocaleTimeString(
                                  "en-GB",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              {act.user?.name && (
                                <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {act.user.name}
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-foreground/90">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                      <Activity className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-semibold">
                        No logged activities for this tender
                      </p>
                      <p className="text-xs mt-1">
                        Actions like status changes, extensions, and follow-ups
                        will log here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (1/3 width on large screens) - Permanently visible Stakeholders & Contacts on ALL tabs */}
        <div className="space-y-6">
          <TenderStakeholdersCard
            client={tender.client}
            tenderContact={{
              contactName: tender.contactName,
              contactEmail: tender.contactEmail,
              contactPhone: tender.contactPhone,
            }}
          />
        </div>
      </div>

      {/* ── Unified Dual-Outcome Decision Dialog (Appointed / Won OR Rejected / Lost with Debrief) ── */}
      <TenderOutcomeDialog
        open={showOutcomeDialog}
        onOpenChange={setShowOutcomeDialog}
        tenderNumber={tender.tenderNumber}
        estimatedValue={tender.value}
        currentStatus={tender.status}
        initialAwardValue={tender.awardValue}
        initialLossReason={tender.lossReason}
        initialLossDetails={tender.lossDetails}
        initialEvaluationNotes={tender.evaluationNotes}
        onAwardSubmit={(data) => {
          handleStatusUpdate("awarded", data);
          setShowOutcomeDialog(false);
        }}
        onLostSubmit={(data) => {
          handleStatusUpdate("lost", data);
          setShowOutcomeDialog(false);
        }}
        isPending={isPending}
      />

      {/* ── Follow-Up Dialog ── */}
      <TenderFollowUpDialog
        open={showFollowUpDialog}
        onOpenChange={setShowFollowUpDialog}
        tenderNumber={tender.tenderNumber}
        onSubmit={handleFollowUpSubmit}
        isPending={isPending}
      />

      {/* ── Delete Dialog ── */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={tender.tenderNumber}
        itemType="Tender"
      />
    </div>
  );
}
