'use client';

import { useState, useTransition } from 'react';
import { 
  Building, 
  Calendar, 
  FileText, 
  Info, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Edit, 
  Plus, 
  File,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  User,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { DocumentManager } from '@/components/documents/document-manager';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  addProjectRisk, 
  updateProjectRiskStatus, 
  submitProjectCloseOut 
} from '@/server/projects';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClientType {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface TenderType {
  id: string;
  tenderNumber: string;
  description: string | null;
  value: string | null;
  submissionDate: Date | null;
}

interface PurchaseOrderType {
  id: string;
  poNumber: string;
  supplierName: string | null;
  description: string;
  totalAmount: string;
  status: string;
  poDate: Date | null;
  expectedDeliveryDate: Date | null;
  deliveredAt: Date | null;
}

interface DocumentType {
  id: string;
  name: string;
  size: string;
  type: string;
  createdAt: Date;
  signedUrl?: string;
  url?: string;
}

interface ProjectActivityType {
  id: string;
  activityType: string;
  description: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface ProjectRiskType {
  id: string;
  title: string;
  description: string;
  severity: string; // 'low' | 'medium' | 'high' | 'critical'
  status: string; // 'open' | 'mitigated' | 'closed'
  mitigationPlan: string | null;
  createdAt: Date;
}

interface ProjectWorkspaceProps {
  project: {
    id: string;
    projectNumber: string;
    description: string | null;
    status: string;
    contractStartDate: Date | null;
    contractEndDate: Date | null;
    awardValue: string | null;
    signedContractUrl: string | null;
    closeOutDate: Date | null;
    closeOutNotes: string | null;
    closeOutSubmittedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    client: ClientType | null;
    tender: TenderType | null;
  };
  purchaseOrders: PurchaseOrderType[];
  documents: DocumentType[];
  activities: ProjectActivityType[];
  risks: ProjectRiskType[];
  organizationId: string;
  userId: string;
}

export function ProjectWorkspace({
  project,
  purchaseOrders,
  documents,
  activities: initialActivities,
  risks: initialRisks,
  organizationId,
  userId,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [activities, setActivities] = useState<ProjectActivityType[]>(initialActivities);
  const [risks, setRisks] = useState<ProjectRiskType[]>(initialRisks);
  
  // Close out state
  const [isCloseOutOpen, setIsCloseOutOpen] = useState(false);
  const [closeOutNotes, setCloseOutNotes] = useState('');
  const [isClosingOut, startCloseOutTransition] = useTransition();

  // Risk logging state
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDescription, setRiskDescription] = useState('');
  const [riskSeverity, setRiskSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [riskMitigation, setRiskMitigation] = useState('');
  const [isLoggingRisk, startRiskTransition] = useTransition();

  // Risk mitigation edit state
  const [isMitigateDialogOpen, setIsMitigateDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<ProjectRiskType | null>(null);
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [mitigationStatus, setMitigationStatus] = useState<'open' | 'mitigated' | 'closed'>('mitigated');
  const [isUpdatingRisk, startUpdateRiskTransition] = useTransition();

  // Calculate project completion and financial stats
  const totalPOAmount = purchaseOrders.reduce(
    (sum, po) => sum + parseFloat(po.totalAmount || '0'), 
    0
  );

  const deliveredPOAmount = purchaseOrders
    .filter(po => po.status === 'delivered' || po.status === 'completed')
    .reduce((sum, po) => sum + parseFloat(po.totalAmount || '0'), 0);

  const partiallyDeliveredAmount = purchaseOrders
    .filter(po => po.status === 'partially_delivered')
    .reduce((sum, po) => sum + parseFloat(po.totalAmount || '0') * 0.5, 0); // Estimating 50% for partially delivered

  const totalDeliveredValue = deliveredPOAmount + partiallyDeliveredAmount;
  const projectCompletionPercentage = totalPOAmount > 0 
    ? Math.round((totalDeliveredValue / totalPOAmount) * 100) 
    : 0;

  const activeRisks = risks.filter(r => r.status === 'open');
  const criticalRisks = risks.filter(r => r.status === 'open' && (r.severity === 'critical' || r.severity === 'high'));

  // Format currency
  const formatCurrency = (value: string | number | null) => {
    if (value === null || value === undefined) return 'R0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(num);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  // Close out handler
  const handleCloseOutSubmit = () => {
    if (closeOutNotes.trim().length < 10) {
      toast.error('Close-out notes must be at least 10 characters long.');
      return;
    }

    startCloseOutTransition(async () => {
      try {
        const res = await submitProjectCloseOut(organizationId, project.id, {
          closeOutNotes,
        });

        if (res.success) {
          toast.success('Project closed out successfully!');
          setIsCloseOutOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to close out project.');
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred.');
      }
    });
  };

  // Log Risk handler
  const handleLogRiskSubmit = () => {
    if (riskTitle.trim().length < 3) {
      toast.error('Risk title must be at least 3 characters.');
      return;
    }
    if (riskDescription.trim().length < 5) {
      toast.error('Risk description must be at least 5 characters.');
      return;
    }

    startRiskTransition(async () => {
      try {
        const res = await addProjectRisk(organizationId, project.id, {
          title: riskTitle,
          description: riskDescription,
          severity: riskSeverity,
          mitigationPlan: riskMitigation,
        });

        if (res.success && res.risk) {
          toast.success('Delivery risk logged successfully.');
          setRisks(prev => [res.risk!, ...prev]);
          setIsRiskDialogOpen(false);
          // Clear inputs
          setRiskTitle('');
          setRiskDescription('');
          setRiskSeverity('medium');
          setRiskMitigation('');
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to log risk.');
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred.');
      }
    });
  };

  // Update Risk handler
  const handleUpdateRiskSubmit = () => {
    if (!selectedRisk) return;

    startUpdateRiskTransition(async () => {
      try {
        const res = await updateProjectRiskStatus(
          organizationId,
          project.id,
          selectedRisk.id,
          mitigationStatus,
          mitigationPlan
        );

        if (res.success && res.risk) {
          toast.success('Risk status updated successfully.');
          setRisks(prev => prev.map(r => r.id === selectedRisk.id ? res.risk! : r));
          setIsMitigateDialogOpen(false);
          setSelectedRisk(null);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update risk.');
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred.');
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-purple-950/45 text-purple-400 border border-purple-800/60 shadow-[0_0_10px_rgba(168,85,247,0.15)]';
      case 'high':
        return 'bg-red-950/45 text-red-400 border border-red-800/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
      case 'medium':
        return 'bg-amber-950/45 text-amber-400 border border-amber-800/60';
      case 'low':
      default:
        return 'bg-emerald-950/45 text-emerald-400 border border-emerald-800/60';
    }
  };

  const getRiskStatusBadge = (status: string) => {
    switch (status) {
      case 'mitigated':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'closed':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700/30';
      case 'open':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <Plus className="h-4 w-4 text-emerald-400" />;
      case 'status_change':
        return <TrendingUp className="h-4 w-4 text-sky-400" />;
      case 'risk_recorded':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'close_out':
        return <CheckCircle2 className="h-4 w-4 text-violet-400" />;
      default:
        return <Activity className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner Workspace Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/80 via-zinc-955 to-zinc-900/50 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="h-7 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 px-3">
                  Projects
                </Button>
              </Link>
              <ChevronRight className="h-3 w-3 text-zinc-600" />
              <span className="text-sm text-zinc-500 font-mono select-all">
                {project.projectNumber.toUpperCase()}
              </span>
              <StatusBadge status={project.status} />
              {project.status === 'completed' && (
                <Badge variant="outline" className="bg-violet-950/20 text-violet-400 border-violet-800/30">
                  Closed Out
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                {project.client?.name || 'Project Workspace'}
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl font-light">
                {project.description || 'Workspace delivery dashboard for tracking purchase orders, documents, activity logs, and delivery risks.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl">
                <Edit className="h-4 w-4 mr-2" />
                Edit Info
              </Button>
            </Link>

            {project.status !== 'completed' ? (
              <Dialog open={isCloseOutOpen} onOpenChange={setIsCloseOutOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-violet-950/30">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Close-out Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] border-white/10 bg-zinc-950 text-white rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Project Close-out Submission</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Archive the project as completed. This records close-out notes, captures the date, and changes the project status.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="closeOutNotes" className="text-zinc-300">Close-out Outcome & Notes</Label>
                      <Textarea
                        id="closeOutNotes"
                        placeholder="Provide details about the project delivery, key milestones achieved, and close-out sign-off..."
                        rows={5}
                        className="bg-zinc-900 border-white/10 text-white focus-visible:ring-violet-500 focus-visible:border-violet-500"
                        value={closeOutNotes}
                        onChange={(e) => setCloseOutNotes(e.target.value)}
                        disabled={isClosingOut}
                      />
                      <p className="text-xs text-zinc-500">Min. 10 characters required. Logs submitter name and timestamp.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCloseOutOpen(false)}
                      disabled={isClosingOut}
                      className="text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCloseOutSubmit}
                      disabled={isClosingOut}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                    >
                      {isClosingOut ? 'Submitting...' : 'Submit Close-out'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="ghost" disabled className="text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <Lock className="h-4 w-4 mr-2" />
                Project Closed
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Delivery Progress Card & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Delivery Progress Card */}
        <Card className="md:col-span-2 overflow-hidden border-white/5 bg-zinc-950 text-white shadow-xl rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-zinc-300">Project Delivery Progress</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Overall completion based on Purchase Order fulfillment</CardDescription>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {projectCompletionPercentage}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full h-3 bg-zinc-905 rounded-full overflow-hidden border border-white/5">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                style={{ width: `${projectCompletionPercentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total PO Value</p>
                <p className="text-sm font-semibold text-zinc-300 mt-1">{formatCurrency(totalPOAmount)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Delivered Value</p>
                <p className="text-sm font-semibold text-emerald-400 mt-1">{formatCurrency(totalDeliveredValue)}</p>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Outstanding</p>
                <p className="text-sm font-semibold text-amber-500 mt-1">{formatCurrency(Math.max(0, totalPOAmount - totalDeliveredValue))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risks Summary Card */}
        <Card className="border-white/5 bg-zinc-955 text-white shadow-xl rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-zinc-300">Risk Profile</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">Active delivery vulnerabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <div className={`h-2.5 w-2.5 rounded-full ${criticalRisks.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-sm text-zinc-300 font-medium">Critical & High Risks</span>
              </div>
              <span className={`text-sm font-bold ${criticalRisks.length > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                {criticalRisks.length} active
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-sm text-zinc-300 font-medium">Active Risks</span>
              </div>
              <span className="text-sm font-bold text-amber-400">
                {activeRisks.length} total
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                <span className="text-sm text-zinc-400">Mitigated / Closed</span>
              </div>
              <span className="text-sm font-bold text-zinc-500">
                {risks.filter(r => r.status !== 'open').length} archived
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-white/5 rounded-xl p-1 w-full max-w-2xl flex items-center justify-start overflow-x-auto space-x-1">
          <TabsTrigger value="info" className="rounded-lg text-zinc-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer px-4">
            <Info className="h-4 w-4 mr-2" />
            Info
          </TabsTrigger>
          <TabsTrigger value="pos" className="rounded-lg text-zinc-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer px-4">
            <DollarSign className="h-4 w-4 mr-2" />
            Purchase Orders
            {purchaseOrders.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-white/10 rounded-full text-[10px] text-white font-semibold">
                {purchaseOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg text-zinc-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer px-4">
            <FileText className="h-4 w-4 mr-2" />
            Documents
            {documents.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-white/10 rounded-full text-[10px] text-white font-semibold">
                {documents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-zinc-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer px-4">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="risks" className="rounded-lg text-zinc-400 hover:text-white data-[state=active]:bg-zinc-800 data-[state=active]:text-white cursor-pointer px-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Risks
            {activeRisks.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] text-red-400 font-semibold animate-pulse">
                {activeRisks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* TAB 1: INFO */}
          <TabsContent value="info" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Originating Tender Summary */}
              <Card className="border-white/5 bg-zinc-950 text-white rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-zinc-300 flex items-center">
                    <File className="h-4 w-4 mr-2 text-blue-400" />
                    Originating Tender
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">Origin tender details for context</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.tender ? (
                    <>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tender Number</label>
                        <p className="text-sm font-medium text-blue-400 mt-0.5">{project.tender.tenderNumber.toUpperCase()}</p>
                      </div>
                      
                      {project.tender.description && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tender Description</label>
                          <p className="text-sm text-zinc-300 mt-0.5 font-light line-clamp-3">{project.tender.description}</p>
                        </div>
                      )}
                      
                      {project.tender.value && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tender Value</label>
                          <p className="text-sm font-semibold text-zinc-200 mt-0.5">{formatCurrency(project.tender.value)}</p>
                        </div>
                      )}

                      {project.tender.submissionDate && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Submission Date</label>
                          <p className="text-sm text-zinc-400 mt-0.5">{formatDate(project.tender.submissionDate)}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-sm italic">
                      No originating tender details linked.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client & Contacts */}
              <Card className="border-white/5 bg-zinc-950 text-white rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-zinc-300 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-emerald-400" />
                    Client & Contact details
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">Stakeholder and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.client ? (
                    <>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Client Name</label>
                        <p className="text-sm font-medium text-zinc-200 mt-0.5">{project.client.name}</p>
                      </div>
                      
                      {project.client.contactName && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Representative</label>
                          <p className="text-sm text-zinc-300 mt-0.5">{project.client.contactName}</p>
                        </div>
                      )}
                      
                      {project.client.contactEmail && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Email Address</label>
                          <p className="text-sm text-zinc-300 mt-0.5 font-mono select-all">
                            {project.client.contactEmail}
                          </p>
                        </div>
                      )}

                      {project.client.contactPhone && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Phone Number</label>
                          <p className="text-sm text-zinc-300 mt-0.5 font-mono">
                            {project.client.contactPhone}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-sm italic">
                      No client assigned to project.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contract Metadata */}
              <Card className="border-white/5 bg-zinc-950 text-white rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-zinc-300 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                    Contract Details
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">Dates, values, and closeout archives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Contract Start Date</label>
                    <p className="text-sm font-medium text-zinc-300 mt-0.5">{formatDate(project.contractStartDate)}</p>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Contract End Date</label>
                    <p className="text-sm font-medium text-zinc-300 mt-0.5">{formatDate(project.contractEndDate)}</p>
                  </div>
                  
                  {project.awardValue && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Award Value</label>
                      <p className="text-sm font-bold text-zinc-200 mt-0.5">{formatCurrency(project.awardValue)}</p>
                    </div>
                  )}

                  {project.signedContractUrl && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Signed Contract</label>
                      <div className="mt-1">
                        <a 
                          href={project.signedContractUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View Signed Contract
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {project.status === 'completed' && project.closeOutDate && (
                    <div className="border-t border-white/5 pt-3 mt-2 space-y-2">
                      <p className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Close-out Outcome notes</p>
                      <div className="p-2.5 bg-violet-950/20 border border-violet-800/20 rounded-lg text-xs text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
                        {project.closeOutNotes}
                      </div>
                      <p className="text-[9px] text-zinc-500">
                        Closed on {formatDate(project.closeOutDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: PURCHASE ORDERS */}
          <TabsContent value="pos" className="space-y-6 outline-none">
            <Card className="border-white/5 bg-zinc-950 text-white rounded-xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Project Purchase Orders</CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">A list of purchase orders issued and their delivery states</CardDescription>
                </div>
                <Link href={`/purchase-orders/new?projectId=${project.id}`}>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500 rounded-lg">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New PO
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {purchaseOrders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {purchaseOrders.map((po) => {
                      return (
                        <div 
                          key={po.id} 
                          className="relative group overflow-hidden p-5 bg-zinc-900/40 rounded-xl border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all duration-300 shadow-md flex flex-col justify-between min-h-[160px]"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors duration-200 font-mono">
                                {po.poNumber}
                              </span>
                              <StatusBadge status={po.status} />
                            </div>
                            
                            <p className="text-xs text-zinc-400 font-light line-clamp-2">
                              {po.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-zinc-500">Supplier</p>
                              <p className="text-xs text-zinc-300 font-medium truncate max-w-[150px]">
                                {po.supplierName || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-zinc-500">Total Value</p>
                              <p className="text-xs font-semibold text-zinc-100">
                                {formatCurrency(po.totalAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-zinc-500">Expected Delivery</p>
                              <p className="text-xs text-zinc-300 font-medium">
                                {formatDate(po.expectedDeliveryDate)}
                              </p>
                            </div>
                            
                            <Link href={`/purchase-orders/${po.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full">
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-white/5 rounded-xl">
                    <DollarSign className="h-10 w-10 mx-auto text-zinc-700 mb-3" />
                    <p className="text-sm font-light">No purchase orders linked to this project workspace.</p>
                    <Link href={`/purchase-orders/new?projectId=${project.id}`} className="mt-4 inline-block">
                      <Button size="sm" variant="outline" className="border-white/10 text-zinc-300 hover:text-white rounded-lg">
                        Create First Purchase Order
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: DOCUMENTS */}
          <TabsContent value="documents" className="outline-none">
            <DocumentManager 
              organizationId={organizationId} 
              entityId={project.id} 
              entityType="project" 
              initialDocuments={documents} 
            />
          </TabsContent>

          {/* TAB 4: ACTIVITY */}
          <TabsContent value="activity" className="space-y-6 outline-none">
            <Card className="border-white/5 bg-zinc-950 text-white rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Project Activity Timeline</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Chronological timeline of all workspace lifecycle events</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                {activities.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-zinc-800 space-y-8 mt-4">
                    {activities.map((act) => {
                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[31px] top-0.5 p-1 bg-zinc-950 border-2 border-zinc-800 rounded-full group-hover:border-zinc-500 transition-colors duration-200">
                            {getActivityIcon(act.activityType)}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-zinc-500">
                                {formatDate(act.createdAt)} • {new Date(act.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {act.user?.name && (
                                <span className="inline-flex items-center text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full">
                                  <User className="h-2.5 w-2.5 mr-1" />
                                  {act.user.name}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-zinc-200 font-light group-hover:text-white transition-colors duration-200">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-white/5 rounded-xl">
                    <Activity className="h-10 w-10 mx-auto text-zinc-700 mb-3" />
                    <p className="text-sm font-light">No logged activities for this project.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: RISKS */}
          <TabsContent value="risks" className="space-y-6 outline-none">
            <Card className="border-white/5 bg-zinc-955 text-white rounded-xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Delivery Risk Logging</CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">Manage project constraints, severity logs, and mitigation measures</CardDescription>
                </div>
                
                <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-500 rounded-lg">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Log Delivery Risk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] border-white/10 bg-zinc-950 text-white rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Log Project Delivery Risk</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Record a delivery vulnerability and assign its severity to track mitigation progress.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="riskTitle" className="text-zinc-300">Risk Title</Label>
                          <Input
                            id="riskTitle"
                            placeholder="e.g. Supplier cement shortage, Transport strikes"
                            className="bg-zinc-900 border-white/10 text-white focus-visible:ring-amber-500"
                            value={riskTitle}
                            onChange={(e) => setRiskTitle(e.target.value)}
                            disabled={isLoggingRisk}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="riskSeverity" className="text-zinc-300">Severity Level</Label>
                          <Select 
                            value={riskSeverity} 
                            onValueChange={(val: any) => setRiskSeverity(val)}
                            disabled={isLoggingRisk}
                          >
                            <SelectTrigger className="bg-zinc-900 border-white/10 text-white focus-visible:ring-amber-500">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                              <SelectItem value="low">Low Severity</SelectItem>
                              <SelectItem value="medium">Medium Severity</SelectItem>
                              <SelectItem value="high">High Severity</SelectItem>
                              <SelectItem value="critical">Critical Severity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="riskDescription" className="text-zinc-300">Detailed Description</Label>
                          <Textarea
                            id="riskDescription"
                            placeholder="Describe how this risk impacts the delivery timeline or budget..."
                            rows={3}
                            className="bg-zinc-900 border-white/10 text-white focus-visible:ring-amber-500"
                            value={riskDescription}
                            onChange={(e) => setRiskDescription(e.target.value)}
                            disabled={isLoggingRisk}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="riskMitigation" className="text-zinc-300">Mitigation Plan (Optional)</Label>
                          <Textarea
                            id="riskMitigation"
                            placeholder="Propose actions to reduce the impact or likelihood of this risk..."
                            rows={3}
                            className="bg-zinc-900 border-white/10 text-white focus-visible:ring-amber-500"
                            value={riskMitigation}
                            onChange={(e) => setRiskMitigation(e.target.value)}
                            disabled={isLoggingRisk}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setIsRiskDialogOpen(false)}
                        disabled={isLoggingRisk}
                        className="text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleLogRiskSubmit}
                        disabled={isLoggingRisk}
                        className="bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        {isLoggingRisk ? 'Saving...' : 'Log Risk'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {risks.length > 0 ? (
                  <div className="space-y-6">
                    {risks.map((risk) => {
                      return (
                        <div 
                          key={risk.id}
                          className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-5 rounded-xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-200"
                        >
                          <div className="space-y-3 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Badge className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getSeverityColor(risk.severity)}`}>
                                {risk.severity}
                              </Badge>
                              <Badge className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getRiskStatusBadge(risk.status)}`}>
                                {risk.status}
                              </Badge>
                              <span className="text-[10px] text-zinc-500">
                                Logged {formatDate(risk.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-semibold text-zinc-100">{risk.title}</h3>
                              <p className="text-xs text-zinc-400 font-light leading-relaxed">{risk.description}</p>
                            </div>

                            {risk.mitigationPlan && (
                              <div className="p-3 rounded-lg bg-zinc-955/60 border border-white/5 text-xs text-zinc-300 font-light">
                                <span className="font-semibold text-zinc-400 block mb-1">Mitigation Plan:</span>
                                {risk.mitigationPlan}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 md:self-center">
                            <Button 
                              size="sm"
                              variant="outline" 
                              onClick={() => {
                                setSelectedRisk(risk);
                                setMitigationPlan(risk.mitigationPlan || '');
                                setMitigationStatus(risk.status as any);
                                setIsMitigateDialogOpen(true);
                              }}
                              className="border-white/10 text-zinc-300 hover:text-white rounded-lg w-full md:w-auto"
                            >
                              Update Status
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Mitigate Dialog */}
                    <Dialog open={isMitigateDialogOpen} onOpenChange={setIsMitigateDialogOpen}>
                      <DialogContent className="sm:max-w-[500px] border-white/10 bg-zinc-955 text-white rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Update Risk & Mitigation</DialogTitle>
                          <DialogDescription className="text-zinc-400">
                            Update the risk mitigation action plan or mark the risk as mitigated/closed.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedRisk && (
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="mitigationStatus" className="text-zinc-300">Risk Status</Label>
                                <Select 
                                  value={mitigationStatus} 
                                  onValueChange={(val: any) => setMitigationStatus(val)}
                                  disabled={isUpdatingRisk}
                                >
                                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white focus-visible:ring-blue-500">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="open">Open (Active Risk)</SelectItem>
                                    <SelectItem value="mitigated">Mitigated (Plan in action)</SelectItem>
                                    <SelectItem value="closed">Closed (No longer a threat)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="mitigationPlan" className="text-zinc-300">Mitigation Actions</Label>
                                <Textarea
                                  id="mitigationPlan"
                                  placeholder="Update details of mitigation steps taken..."
                                  rows={4}
                                  className="bg-zinc-900 border-white/10 text-white focus-visible:ring-blue-500"
                                  value={mitigationPlan}
                                  onChange={(e) => setMitigationPlan(e.target.value)}
                                  disabled={isUpdatingRisk}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsMitigateDialogOpen(false);
                              setSelectedRisk(null);
                            }}
                            disabled={isUpdatingRisk}
                            className="text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateRiskSubmit}
                            disabled={isUpdatingRisk}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            {isUpdatingRisk ? 'Saving...' : 'Update Status'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-white/5 rounded-xl">
                    <ShieldAlert className="h-10 w-10 mx-auto text-zinc-700 mb-3" />
                    <p className="text-sm font-light">No risks logged for this project workspace.</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsRiskDialogOpen(true)}
                      className="mt-4 border-white/10 text-zinc-300 hover:text-white rounded-lg"
                    >
                      Log First Risk
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
