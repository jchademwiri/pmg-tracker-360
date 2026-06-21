'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Building,
  CheckSquare,
  CheckCircle2,
  Plus,
  PhoneCall,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteTender, updateTenderStatus, createTenderFollowUp } from '@/server/tenders';
import { formatCurrency, formatDate as sharedFormatDate, formatDateTime } from '@/lib/format';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentManager } from '@/components/documents/document-manager';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';

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
  size: string;
  type: string;
  createdAt: Date;
  signedUrl?: string;
  url?: string;
}

import { ExtensionList, ExtendedTenderExtension } from './extension-list';
import { TenderToProjectDialog } from './tender-to-project-dialog';
import { TenderLostDialog } from './tender-lost-dialog';
import { TenderFollowUpDialog } from './tender-follow-up-dialog';

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



export function TenderDetails({
  tender,
  organizationId,
  documents,
  extensions,
  followUps,
}: TenderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleFollowUpSubmit = async (data: any) => {
    startTransition(async () => {
      const result = await createTenderFollowUp(organizationId, {
        tenderId: tender.id,
        ...data,
      });
      if (result.success) {
        setShowFollowUpDialog(false);
        toast.success('Follow-up logged successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create follow-up');
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
        toast.success('Tender deleted successfully');
        setIsDeleteDialogOpen(false);
        router.push('/tenders');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete tender');
      }
    });
  };

  const handleStatusUpdate = async (
    newStatus: 'new' | 'review' | 'approved_to_prepare' | 'preparation' | 'ready' | 'submitted' | 'evaluation' | 'awarded' | 'lost' | 'cancelled' | 'closed' | 'open',
    details?: {
      awardValue?: string | null;
      contractStartDate?: Date | null;
      contractEndDate?: Date | null;
      signedContractUrl?: string | null;
      lossReason?: string | null;
      lossDetails?: string | null;
      evaluationNotes?: string | null;
    }
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
        if (newStatus === 'awarded' && result.projectId) {
          router.push(`/projects/${result.projectId}/edit`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || 'Failed to update tender status');
      }
    });
  };

  const handleBack = () => {
    router.push('/tenders');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return formatDateTime(date, 'Not set');
  };

  const formatDateOnly = (date: Date | null) => {
    if (!date) return 'Not set';
    return sharedFormatDate(date, 'Not set');
  };



  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-xl text-foreground/80 font-bold">
            {tender.tenderNumber.toUpperCase()}
          </h1>

          <Button
            variant="outline"
            onClick={handleEdit}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Tender
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Tender
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tender
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tender Lifecycle Stage Stepper */}
      <Card className="rounded-lg shadow-sm border border-border/40 bg-card/50 overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/30 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tender Lifecycle Stage</span>
            <StatusBadge status={tender.status} />
          </div>
          <span className="text-xs text-muted-foreground">Click a stage to transition the workflow</span>
        </div>
        <div className="p-5 overflow-x-auto">
          {(() => {
            const stages = [
              { value: 'new', label: 'Opportunity' },
              { value: 'review', label: 'To Review' },
              { value: 'approved_to_prepare', label: 'Approved' },
              { value: 'preparation', label: 'Preparing' },
              { value: 'ready', label: 'Ready' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'evaluation', label: 'Evaluation' },
              { value: 'awarded', label: tender.status === 'lost' ? 'Lost' : 'Awarded' },
            ];

            const getStatusIndex = (status: string) => {
              switch (status) {
                case 'new':
                case 'open':
                  return 0;
                case 'review':
                  return 1;
                case 'approved_to_prepare':
                  return 2;
                case 'preparation':
                  return 3;
                case 'ready':
                  return 4;
                case 'submitted':
                  return 5;
                case 'evaluation':
                  return 6;
                case 'awarded':
                case 'lost':
                  return 7;
                default:
                  return -1;
              }
            };

            const currentStatusIndex = getStatusIndex(tender.status);

            const handleStageClick = (stageValue: string) => {
              if (stageValue === tender.status) return;
              if (stageValue === 'new' && tender.status === 'open') return;
              if (stageValue === 'awarded') {
                setShowAwardDialog(true);
                return;
              }
              handleStatusUpdate(stageValue as any);
            };

            return (
              <div className="flex items-center w-full min-w-[750px] justify-between relative py-2">
                {/* Background progress line */}
                <div className="absolute top-[21px] left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
                
                {/* Active progress line */}
                {currentStatusIndex >= 0 && (
                  <div 
                    className="absolute top-[21px] left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500 ease-in-out" 
                    style={{ 
                      width: `${(currentStatusIndex / (stages.length - 1)) * 100}%` 
                    }}
                  />
                )}

                {stages.map((stage, idx) => {
                  const isCompleted = currentStatusIndex >= 0 && idx < currentStatusIndex;
                  const isActive = idx === currentStatusIndex;
                  const isTerminal = stage.value === 'awarded';
                  const isLost = tender.status === 'lost' && isTerminal;

                  let dotColor = "bg-background border-border text-muted-foreground hover:border-blue-500/50";
                  if (isCompleted) {
                    dotColor = "bg-blue-500 border-blue-500 text-white";
                  } else if (isActive) {
                    dotColor = isLost 
                      ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20" 
                      : "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-500/10";
                  }

                  return (
                    <button
                      key={stage.value}
                      onClick={() => handleStageClick(stage.value)}
                      disabled={isPending}
                      className="flex flex-col items-center relative z-10 cursor-pointer group focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${dotColor} group-hover:scale-105`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[11px] font-semibold mt-2 transition-colors duration-300 ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {stage.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Information */}
            <div className="xl:col-span-3 space-y-6">
              {/* Basic Information */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Tender Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tender Number
                      </label>
                      <p className="text-lg font-medium text-blue-600">
                        {tender.tenderNumber.toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="mt-1">
                        <StatusBadge status={tender.status} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tender Value
                      </label>
                      <p className="text-lg font-medium">
                        {formatCurrency(tender.value)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Closing Date
                      </label>
                      <p className="text-foreground">
                        {formatDate(tender.submissionDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tender Validity (Initial)
                      </label>
                      <p className="text-foreground">
                        {tender.validityDays ? `${tender.validityDays} Days` : formatDateOnly(tender.validityDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Current Validity Deadline
                      </label>
                      <p className="text-foreground font-semibold text-blue-600">
                        {formatDateOnly(tender.evaluationDate)}
                      </p>
                    </div>
                  </div>

                  {/* Award Outcome Details */}
                  {tender.status === 'awarded' && (
                    <div className="border-t pt-4 mt-2">
                      <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Award & Appointment Outcome
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-500/[0.01] border border-emerald-500/10 rounded-lg p-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Final Award Value</label>
                          <p className="text-base font-semibold text-emerald-600">{formatCurrency(tender.awardValue || tender.value)}</p>
                        </div>
                        {tender.evaluationNotes && (
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outcome Notes</label>
                            <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{tender.evaluationNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lost Outcome Details */}
                  {tender.status === 'lost' && (
                    <div className="border-t pt-4 mt-2">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Tender Outcome Details (Lost / Rejected)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-500/[0.01] border border-red-500/10 rounded-lg p-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason for Loss</label>
                          <p className="text-sm font-medium capitalize mt-0.5">{tender.lossReason ? tender.lossReason.replace('_', ' ') : 'Not recorded'}</p>
                        </div>
                        {tender.lossDetails && (
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Loss Details</label>
                            <p className="text-sm text-foreground mt-0.5">{tender.lossDetails}</p>
                          </div>
                        )}
                        {tender.evaluationNotes && (
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evaluation / Feedback Notes</label>
                            <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{tender.evaluationNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {tender.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="text-foreground whitespace-pre-wrap">
                        {tender.description}
                      </p>
                    </div>
                  )}

                  {!tender.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Description
                      </label>
                      <p className="text-muted-foreground italic">
                        No description added
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tender Follow-up Contact */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2 text-amber-600" />
                    Tender Follow-up Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tender.contactName || tender.contactEmail || tender.contactPhone ? (
                    <div className="space-y-3">
                      {tender.contactName && (
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Contact Person
                            </label>
                            <p className="text-foreground">{tender.contactName}</p>
                          </div>
                        </div>
                      )}

                      {tender.contactEmail && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Email Address
                            </label>
                            <p className="text-foreground">
                              <Link
                                href={`mailto:${tender.contactEmail}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {tender.contactEmail}
                              </Link>
                            </p>
                          </div>
                        </div>
                      )}

                      {tender.contactPhone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Phone Number
                            </label>
                            <p className="text-foreground">
                              <Link
                                href={`tel:${tender.contactPhone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {tender.contactPhone}
                              </Link>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No tender-specific follow-up contact added.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Building className="h-5 w-5 mr-2 text-green-600" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tender.client ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Client Name
                          </label>
                          <p className="text-lg font-medium">
                            {tender.client.name}
                          </p>
                        </div>
                        <Link href={`/clients/${tender.client.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            View Client
                          </Button>
                        </Link>
                      </div>

                      {(tender.client.contactName ||
                        tender.client.contactEmail ||
                        tender.client.contactPhone) && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            {tender.client.contactName && (
                              <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Contact Person
                                  </label>
                                  <p className="text-foreground">
                                    {tender.client.contactName}
                                  </p>
                                </div>
                              </div>
                            )}

                            {tender.client.contactEmail && (
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Email Address
                                  </label>
                                  <p className="text-foreground">
                                    <Link
                                      href={`mailto:${tender.client.contactEmail}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {tender.client.contactEmail}
                                    </Link>
                                  </p>
                                </div>
                              </div>
                            )}

                            {tender.client.contactPhone && (
                              <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Phone Number
                                  </label>
                                  <p className="text-foreground">
                                    <Link
                                      href={`tel:${tender.client.contactPhone}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {tender.client.contactPhone}
                                    </Link>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No Client Information
                      </h3>
                      <p className="text-muted-foreground">
                        Client information is not available for this tender.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Bidding Compliance Checklist */}
              <Card className="rounded-lg shadow-sm border border-border/40 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                    Bidding Compliance
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Required document checklist for submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const checkComplianceItem = (keywords: string[]) => {
                      return documents.some((doc) =>
                        keywords.some((kw) => doc.name.toLowerCase().includes(kw))
                      );
                    };

                    const complianceItems = [
                      { id: 'tax', label: 'Tax Clearance Certificate', keywords: ['tax', 'clearance'] },
                      { id: 'bee', label: 'B-BBEE / BEE Certificate', keywords: ['bee', 'b-bbee'] },
                      { id: 'tech', label: 'Technical Proposal Spec', keywords: ['technical', 'proposal', 'scope'] },
                      { id: 'price', label: 'Financial / Pricing Schedule', keywords: ['price', 'pricing', 'financial', 'schedule'] },
                      { id: 'sbd', label: 'Signed Bidding Docs (SBD)', keywords: ['sbd'] },
                      { id: 'ck', label: 'Company Profile / CIPC (CK)', keywords: ['ck', 'cipc', 'profile', 'registration'] },
                    ];

                    const completedCount = complianceItems.filter(item => checkComplianceItem(item.keywords)).length;

                    return (
                      <>
                        {/* Progress Bar */}
                        <div className="space-y-1.5 pb-2 border-b border-border/30">
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <span>Documents Attached</span>
                            <span>{completedCount} / {complianceItems.length}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500 ease-in-out" 
                              style={{ width: `${(completedCount / complianceItems.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Checklist Items */}
                        <div className="space-y-2.5 pt-1">
                          {complianceItems.map((item) => {
                            const isDone = checkComplianceItem(item.keywords);
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                                  )}
                                  <span className={`text-xs truncate ${isDone ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                    {item.label}
                                  </span>
                                </div>
                                {!isDone && (
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => setActiveTab('documents')}
                                    className="h-6 text-[10px] px-2 py-0 text-blue-500 hover:text-blue-700 cursor-pointer"
                                  >
                                    Attach
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Tender
                  </Button>
                  {(tender.contactEmail || tender.client?.contactEmail) && (
                    <Button
                      variant="outline"
                      className="w-full justify-start cursor-pointer"
                      onClick={() =>
                        window.open(
                          `mailto:${tender.contactEmail || tender.client?.contactEmail}`,
                          '_blank'
                        )
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Follow-up Contact
                    </Button>
                  )}
                  {(tender.contactPhone || tender.client?.contactPhone) && (
                    <Button
                      variant="outline"
                      className="w-full justify-start cursor-pointer"
                      onClick={() =>
                        window.open(
                          `tel:${tender.contactPhone || tender.client?.contactPhone}`,
                          '_blank'
                        )
                      }
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Follow-up Contact
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Status Management */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Status Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-3">
                    Current Status:{' '}
                    <StatusBadge status={tender.status} />
                  </div>

                   {tender.status !== 'evaluation' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('evaluation')}
                      disabled={isPending}
                    >
                      Mark as Submitted / Evaluation
                    </Button>
                  )}

                  {tender.status !== 'awarded' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => setShowAwardDialog(true)}
                      disabled={isPending}
                    >
                      Mark as Appointed / Awarded
                    </Button>
                  )}

                  {tender.status !== 'lost' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => setShowLostDialog(true)}
                      disabled={isPending}
                    >
                      Mark as Rejected / Lost
                    </Button>
                  )}

                  {tender.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('closed')}
                      disabled={isPending}
                    >
                      Mark as Closed
                    </Button>
                  )}

                  {tender.status !== 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('open')}
                      disabled={isPending}
                    >
                      Mark as Open
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created
                    </label>
                    <p className="text-sm">{formatDate(tender.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="text-sm">{formatDate(tender.updatedAt)}</p>
                  </div>
                  {tender.submissionDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Closing Date
                      </label>
                      <p className="text-sm">
                        {formatDate(tender.submissionDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentManager
            organizationId={organizationId}
            entityId={tender.id}
            entityType="tender"
            initialDocuments={documents}
          />
        </TabsContent>

        <TabsContent value="extensions" className="mt-6">
          <ExtensionList
            extensions={extensions}
            organizationId={organizationId}
            tenderId={tender.id}
          />
        </TabsContent>

        <TabsContent value="follow-ups" className="mt-6">
          <Card className="rounded-lg shadow-sm border border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl">Follow-up Log Workspace</CardTitle>
                <CardDescription>Keep track of all client communication and bid status queries</CardDescription>
              </div>
              <Button onClick={() => setShowFollowUpDialog(true)} className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> Log Follow-up
              </Button>
            </CardHeader>
            <CardContent>
              {followUps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <PhoneCall className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-semibold text-sm">No follow-ups logged yet</p>
                  <p className="text-xs mt-1">Keep a digital trail of updates to ensure you stay aligned on validities.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-blue-500/20 pl-6 ml-3 space-y-6">
                  {followUps.map((f) => (
                    <div key={f.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 bg-background border-2 border-blue-500 rounded-full h-4 w-4 z-10 flex items-center justify-center">
                        <span className="bg-blue-500 rounded-full h-1.5 w-1.5" />
                      </span>
                      <div className="bg-background border border-border/40 hover:border-blue-500/10 p-4 rounded-xl shadow-sm transition-all duration-300">
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div>
                            <span className="text-xs font-semibold text-blue-500">{formatDateOnly(f.followUpDate)}</span>
                            {f.contactPerson && (
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">Contact: <span className="text-foreground">{f.contactPerson}</span></p>
                            )}
                          </div>
                          {f.nextFollowUpDate && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/[0.02] border-amber-500/20">
                              Next: {formatDateOnly(f.nextFollowUpDate)}
                            </Badge>
                          )}
                        </div>
                        {f.notes && (
                          <p className="text-sm text-foreground/80 mt-2.5 whitespace-pre-wrap">{f.notes}</p>
                        )}
                        {f.outcome && (
                          <div className="mt-3 flex items-start gap-1.5 bg-muted/30 p-2 rounded-lg text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground shrink-0">Outcome:</span>
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
      </Tabs>

      <TenderToProjectDialog
        open={showAwardDialog}
        onOpenChange={setShowAwardDialog}
        tenderNumber={tender.tenderNumber}
        estimatedValue={tender.value}
        onSubmit={(data) => {
          handleStatusUpdate('awarded', data);
          setShowAwardDialog(false);
        }}
        isPending={isPending}
      />

      <TenderLostDialog
        open={showLostDialog}
        onOpenChange={setShowLostDialog}
        tenderNumber={tender.tenderNumber}
        onSubmit={(data) => {
          handleStatusUpdate('lost', data);
          setShowLostDialog(false);
        }}
        isPending={isPending}
      />

      <TenderFollowUpDialog
        open={showFollowUpDialog}
        onOpenChange={setShowFollowUpDialog}
        tenderNumber={tender.tenderNumber}
        onSubmit={handleFollowUpSubmit}
        isPending={isPending}
      />

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
