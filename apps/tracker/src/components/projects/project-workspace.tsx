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
  Package,
  Truck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  User,
  Lock,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { DocumentManager } from '@/components/documents/document-manager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  deliveryNotes?: Array<{
    id: string;
    deliveryNoteNumber: string;
    recipientName: string;
    receivedAt: Date;
    status: string;
    items?: Array<{
      id: string;
      quantityDelivered: string;
      deliveryValue?: string;
    }>;
  }>;
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

interface ProjectLineItemType {
  id: string;
  description: string;
  unit: string;
  unitPrice: string;
  updatedAt: Date;
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
  lineItems: ProjectLineItemType[];
  activities: ProjectActivityType[];
  risks: ProjectRiskType[];
  organizationId: string;
  userId: string;
}

export function ProjectWorkspace({
  project,
  purchaseOrders,
  documents,
  lineItems,
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
  const deliveryNotes = purchaseOrders.flatMap((po) =>
    (po.deliveryNotes || []).map((note) => ({
      ...note,
      poId: po.id,
      poNumber: po.poNumber,
    }))
  );
  const totalDeliveryNotes = deliveryNotes.length;
  const totalDeliveryNoteValue = deliveryNotes.reduce((sum, note) => {
    return (
      sum +
      (note.items || []).reduce(
        (itemSum, item) => itemSum + parseFloat(item.deliveryValue || '0'),
        0
      )
    );
  }, 0);

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

  // Close-out Readiness Checklist checks
  const allPOsDelivered = purchaseOrders.length === 0 || purchaseOrders.every(po => ['delivered', 'completed'].includes(po.status));
  const allRisksClosed = risks.length === 0 || risks.every(r => r.status === 'closed');
  const hasSignedContract = !!project.signedContractUrl || documents.some(doc => doc.name.toLowerCase().includes('contract') || doc.name.toLowerCase().includes('sla'));
  const allDeliveryNotesVerified = deliveryNotes.length === 0 || deliveryNotes.every(dn => dn.status === 'verified');

  const closeOutChecklist = [
    {
      id: 'pos',
      label: 'All Purchase Orders Delivered',
      desc: 'All purchase orders must have status "delivered" or "completed".',
      status: allPOsDelivered,
    },
    {
      id: 'risks',
      label: 'All Project Risks Closed',
      desc: 'All project risks must be in "closed" status.',
      status: allRisksClosed,
    },
    {
      id: 'contract',
      label: 'Signed Contract / SLA Document Uploaded',
      desc: 'Project must have a signed contract URL or contract/SLA document uploaded.',
      status: hasSignedContract,
    },
    {
      id: 'deliveryNotes',
      label: 'All Delivery Notes Verified',
      desc: 'All logged purchase order delivery notes must be verified.',
      status: allDeliveryNotesVerified,
    },
  ];

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
      <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/projects">
                <Button variant="outline" size="sm" className="h-7 px-3 text-muted-foreground">
                  Projects
                </Button>
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-mono select-all">
                {project.projectNumber.toUpperCase()}
              </span>
              <StatusBadge status={project.status} />
              {project.status === 'active' && criticalRisks.length > 0 && (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500">
                  Critical Risks
                </Badge>
              )}
              {project.status === 'active' && criticalRisks.length === 0 && !allPOsDelivered && (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500">
                  In Progress
                </Badge>
              )}
              {project.status === 'active' && criticalRisks.length === 0 && allPOsDelivered && (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                  On Track
                </Badge>
              )}
              {project.status === 'completed' && (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border/40">
                  Closed Out
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {project.client?.name || 'Project Workspace'}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl font-light">
                {project.description || 'Workspace delivery dashboard for tracking purchase orders, documents, activity logs, and delivery risks.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/projects/purchase-orders/create?projectId=${project.id}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create PO
              </Button>
            </Link>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link href={`/projects/${project.id}/items/new`}>
                <Button variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </Link>
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Info
                </Button>
              </Link>

              {project.status !== 'completed' ? (
                <Dialog open={isCloseOutOpen} onOpenChange={setIsCloseOutOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Close-out Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Project Close-out Submission</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Archive the project as completed. This records close-out notes, captures the date, and changes the project status.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Close-out Readiness Checklist */}                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Close-out Readiness Checks</h4>
                        <div className="space-y-2.5">
                          {closeOutChecklist.map((item) => (
                            <div key={item.id} className="flex items-start gap-2.5 text-sm">
                              {item.status ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className={`font-medium ${item.status ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {item.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {criticalRisks.length > 0 && (
                          <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span><strong>Critical risks must be resolved</strong> before close-out can be submitted. Please mitigate {criticalRisks.length > 1 ? 'these risks' : 'this risk'} in the Risks tab first.</span>
                          </div>
                        )}
                        {!closeOutChecklist.every(item => item.status) && criticalRisks.length === 0 && (
                          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>Some checks are not satisfied. You can still submit the close-out if necessary.</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="closeOutNotes" className="text-foreground">Close-out Outcome & Notes</Label>
                        <Textarea
                          id="closeOutNotes"
                          placeholder="Provide details about the project delivery, key milestones achieved, and close-out sign-off..."
                          rows={5}
                          className="bg-background border-border/40 text-foreground focus-visible:ring-primary focus-visible:border-primary"
                          value={closeOutNotes}
                          onChange={(e) => setCloseOutNotes(e.target.value)}
                          disabled={isClosingOut}
                        />
                        <p className="text-xs text-muted-foreground">Min. 10 characters required. Logs submitter name and timestamp.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setIsCloseOutOpen(false)}
                        disabled={isClosingOut}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCloseOutSubmit}
                        disabled={isClosingOut || criticalRisks.length > 0}
                        title={criticalRisks.length > 0 ? 'Resolve critical risks first' : undefined}
                      >
                        {criticalRisks.length > 0 ? 'Critical Risks Blocking' : (isClosingOut ? 'Submitting...' : 'Submit Close-out')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button variant="ghost" disabled className="text-muted-foreground bg-muted/50 border border-border/40 rounded-xl">
                  <Lock className="h-4 w-4 mr-2" />
                  Project Closed
                </Button>
              )}
            </div>

            {/* Mobile overflow menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/items/new`}>
                      <Package className="h-4 w-4 mr-2" />
                      Add Item
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Info
                    </Link>
                  </DropdownMenuItem>
                  {project.status !== 'completed' ? (
                    <DropdownMenuItem onClick={() => setIsCloseOutOpen(true)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Close-out Project
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled>
                      <Lock className="h-4 w-4 mr-2" />
                      Project Closed
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Navigation */}
      <div className="sticky top-16 z-20 rounded-lg border bg-muted/80 p-1 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { value: 'info', label: 'Overview', icon: Info, count: null },
            { value: 'pos', label: 'Orders', icon: DollarSign, count: purchaseOrders.length },
            { value: 'items', label: 'Items', icon: Package, count: lineItems.length },
            { value: 'deliveries', label: 'Deliveries', icon: Truck, count: totalDeliveryNotes },
            { value: 'documents', label: 'Documents', icon: FileText, count: documents.length },
            { value: 'activity', label: 'Activity', icon: Activity, count: activities.length },
            { value: 'risks', label: 'Risks', icon: AlertTriangle, count: activeRisks.length },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveTab(item.value)}                          className={`group inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.count !== null && item.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* TAB 1: INFO */}
          <TabsContent value="info" className="space-y-6 outline-none">
            {/* Next Best Action Suggestion */}
            {(project.status === 'active' && (criticalRisks.length > 0 || allPOsDelivered || purchaseOrders.some(po => ['open', 'sent', 'partially_delivered'].includes(po.status)))) && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Next Best Action</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {criticalRisks.length > 0
                          ? `Mitigate ${criticalRisks.length} critical project risk${criticalRisks.length > 1 ? 's' : ''} before proceeding with deliveries.`
                          : (purchaseOrders.some(po => ['open', 'sent'].includes(po.status))
                            ? 'Follow up on pending deliveries with suppliers.'
                            : (purchaseOrders.some(po => po.status === 'partially_delivered')
                              ? 'Complete outstanding quantities on partially delivered orders.'
                              : (allPOsDelivered && closeOutChecklist.some(c => !c.status)
                                ? 'Resolve remaining close-out items to archive the project.'
                                : 'All deliveries are complete. Consider submitting the project close-out.'
                              )
                            )
                          )
                        }
                      </p>
                    </div>
                    {criticalRisks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('risks')}
                        className="shrink-0 text-xs text-blue-500 hover:text-blue-400 font-medium"
                      >
                        View Risks →
                      </button>
                    )}
                    {allPOsDelivered && criticalRisks.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCloseOutOpen(true)}
                        className="shrink-0 text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                      >
                        Close-out Now →
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Progress & Risk Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Project Delivery Progress</CardTitle>
                      <CardDescription className="text-muted-foreground text-xs">Overall completion based on Purchase Order fulfillment</CardDescription>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {projectCompletionPercentage}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                    <div 
                      className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${projectCompletionPercentage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total PO Value</p>
                      <p className="text-sm font-semibold text-foreground mt-1">{formatCurrency(totalPOAmount)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Delivered Value</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalDeliveredValue)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Outstanding</p>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 mt-1">{formatCurrency(Math.max(0, totalPOAmount - totalDeliveredValue))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Risk Profile</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">Active delivery vulnerabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div className="flex items-center space-x-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${criticalRisks.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      <span className="text-sm text-foreground font-medium">Critical & High Risks</span>
                    </div>
                    <span className={`text-sm font-bold ${criticalRisks.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {criticalRisks.length} active
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div className="flex items-center space-x-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-sm text-foreground font-medium">Active Risks</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {activeRisks.length} total
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Mitigated / Closed</span>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">
                      {risks.filter(r => r.status !== 'open').length} archived
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Originating Tender Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center">
                    <File className="h-4 w-4 mr-2 text-blue-500" />
                    Originating Tender
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">Origin tender details for context</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.tender ? (
                    <>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tender Number</label>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">{project.tender.tenderNumber.toUpperCase()}</p>
                      </div>
                      
                      {project.tender.description && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tender Description</label>
                          <p className="text-sm text-foreground mt-0.5 font-light line-clamp-3">{project.tender.description}</p>
                        </div>
                      )}
                      
                      {project.tender.value && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tender Value</label>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(project.tender.value)}</p>
                        </div>
                      )}

                      {project.tender.submissionDate && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Submission Date</label>
                          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(project.tender.submissionDate)}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm italic">
                      No originating tender details linked.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client & Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center">
                    <Building className="h-4 w-4 mr-2 text-emerald-500" />
                    Client & Contact details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">Stakeholder and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.client ? (
                    <>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Client Name</label>
                        <p className="text-sm font-medium text-foreground mt-0.5">{project.client.name}</p>
                      </div>
                      
                      {project.client.contactName && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Representative</label>
                          <p className="text-sm text-foreground mt-0.5">{project.client.contactName}</p>
                        </div>
                      )}
                      
                      {project.client.contactEmail && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</label>
                          <p className="text-sm text-foreground mt-0.5 font-mono select-all">
                            {project.client.contactEmail}
                          </p>
                        </div>
                      )}

                      {project.client.contactPhone && (
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone Number</label>
                          <p className="text-sm text-foreground mt-0.5 font-mono">
                            {project.client.contactPhone}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm italic">
                      No client assigned to project.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contract Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    Contract Details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">Dates, values, and closeout archives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contract Start Date</label>
                    <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(project.contractStartDate)}</p>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contract End Date</label>
                    <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(project.contractEndDate)}</p>
                  </div>
                  
                  {project.awardValue && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Award Value</label>
                      <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(project.awardValue)}</p>
                    </div>
                  )}

                  {project.signedContractUrl && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Signed Contract</label>
                      <div className="mt-1">
                        <a 
                          href={project.signedContractUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          View Signed Contract
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  )}

                  {project.status === 'completed' && project.closeOutDate && (
                    <div className="border-t border-border/30 pt-3 mt-2 space-y-2">
                      <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">Close-out Outcome notes</p>
                      <div className="p-2.5 bg-muted border border-border/30 rounded-lg text-xs text-muted-foreground font-light leading-relaxed whitespace-pre-wrap">
                        {project.closeOutNotes}
                      </div>
                      <p className="text-[9px] text-muted-foreground">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Project Purchase Orders</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">A list of purchase orders issued and their delivery states</CardDescription>
                </div>
                <Link href={`/projects/purchase-orders/create?projectId=${project.id}`}>
                  <Button size="sm">
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
                          className="relative group p-5 bg-muted/40 rounded-lg border hover:border-foreground/20 hover:bg-muted/60 transition-all duration-200 flex flex-col justify-between min-h-[160px]"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200 font-mono">
                                {po.poNumber}
                              </span>
                              <StatusBadge status={po.status} />
                            </div>
                            
                            <p className="text-xs text-muted-foreground font-light line-clamp-2">
                              {po.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-border/40 mt-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Supplier</p>
                              <p className="text-xs text-foreground font-medium truncate max-w-[150px]">
                                {po.supplierName || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Value</p>
                              <p className="text-xs font-semibold text-foreground">
                                {formatCurrency(po.totalAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Expected Delivery</p>
                              <p className="text-xs text-foreground font-medium">
                                {formatDate(po.expectedDeliveryDate)}
                              </p>
                            </div>
                            
                            <Link href={`/projects/purchase-orders/${po.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                    <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-light">No purchase orders linked to this project workspace.</p>
                    <Link href={`/projects/purchase-orders/create?projectId=${project.id}`} className="mt-4 inline-block">
                      <Button size="sm" variant="outline" className="rounded-lg">
                        Create First PO
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: ITEMS */}
          <TabsContent value="items" className="space-y-6 outline-none">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Project Saved Items</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Saved line items available for purchase orders on this project
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}/items`}>
                    <Button size="sm" variant="outline">
                      Manage Items
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/items/new`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Item
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {lineItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {lineItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border bg-muted/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </div>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Link href={`/projects/${project.id}/items/${item.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-8">
                              Edit
                              <ArrowRight className="h-3.5 w-3.5 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                    <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-light">No saved project items yet.</p>
                    <Link href={`/projects/${project.id}/items/new`} className="mt-4 inline-block">
                      <Button size="sm" variant="outline" className="rounded-lg">
                        Add First Item
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: DELIVERIES */}
          <TabsContent value="deliveries" className="space-y-6 outline-none">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Project Deliveries</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Delivery notes recorded against purchase orders in this project
                  </CardDescription>
                </div>
                <div className="rounded-md border bg-muted/60 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivery Value</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalDeliveryNoteValue)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {deliveryNotes.length > 0 ? (
                  <div className="space-y-4">
                    {deliveryNotes.map((note) => {
                      const noteValue = (note.items || []).reduce(
                        (sum, item) => sum + parseFloat(item.deliveryValue || '0'),
                        0
                      );

                      return (
                        <div
                          key={note.id}
                          className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {note.deliveryNoteNumber}
                              </span>
                              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {note.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              PO {note.poNumber} • received by {note.recipientName} on {formatDate(note.receivedAt)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-4 md:justify-end">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Items</p>
                              <p className="text-sm font-semibold text-foreground">{note.items?.length || 0}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</p>
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(noteValue)}</p>
                            </div>
                            <Link href={`/projects/purchase-orders/${note.poId}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                    <Truck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-light">No delivery notes recorded for this project yet.</p>
                    {purchaseOrders.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Open a purchase order to record the first delivery note.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: DOCUMENTS */}
          <TabsContent value="documents" className="outline-none">
            <DocumentManager 
              organizationId={organizationId} 
              entityId={project.id} 
              entityType="project" 
              initialDocuments={documents} 
            />
          </TabsContent>          {/* TAB 6: ACTIVITY */}
          <TabsContent value="activity" className="space-y-6 outline-none">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Project Activity Timeline</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">Chronological timeline of all workspace lifecycle events</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                {activities.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-border space-y-8 mt-4">
                    {activities.map((act) => {
                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[31px] top-0.5 p-1 bg-card border-2 border-border rounded-full group-hover:border-muted-foreground transition-colors duration-200">
                            {getActivityIcon(act.activityType)}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(act.createdAt)} • {new Date(act.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {act.user?.name && (
                                <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  <User className="h-2.5 w-2.5 mr-1" />
                                  {act.user.name}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-foreground font-light transition-colors duration-200">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                    <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-light">No logged activities for this project.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: RISKS */}
          <TabsContent value="risks" className="space-y-6 outline-none">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Delivery Risk Logging</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">Manage project constraints, severity logs, and mitigation measures</CardDescription>
                </div>
                
                <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-500">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Log Delivery Risk
                    </Button>
                  </DialogTrigger>                    <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Log Project Delivery Risk</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Record a delivery vulnerability and assign its severity to track mitigation progress.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="riskTitle" className="text-foreground">Risk Title</Label>
                          <Input
                            id="riskTitle"
                            placeholder="e.g. Supplier cement shortage, Transport strikes"
                            className="bg-background border-border/40 text-foreground focus-visible:ring-amber-500"
                            value={riskTitle}
                            onChange={(e) => setRiskTitle(e.target.value)}
                            disabled={isLoggingRisk}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="riskSeverity" className="text-foreground">Severity Level</Label>
                          <Select 
                            value={riskSeverity} 
                            onValueChange={(val: any) => setRiskSeverity(val)}
                            disabled={isLoggingRisk}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border/40 text-foreground">
                              <SelectItem value="low">Low Severity</SelectItem>
                              <SelectItem value="medium">Medium Severity</SelectItem>
                              <SelectItem value="high">High Severity</SelectItem>
                              <SelectItem value="critical">Critical Severity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="riskDescription" className="text-foreground">Detailed Description</Label>
                          <Textarea
                            id="riskDescription"
                            placeholder="Describe how this risk impacts the delivery timeline or budget..."
                            rows={3}
                            className="bg-background border-border/40 text-foreground focus-visible:ring-amber-500"
                            value={riskDescription}
                            onChange={(e) => setRiskDescription(e.target.value)}
                            disabled={isLoggingRisk}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="riskMitigation" className="text-foreground">Mitigation Plan (Optional)</Label>
                          <Textarea
                            id="riskMitigation"
                            placeholder="Propose actions to reduce the impact or likelihood of this risk..."
                            rows={3}
                            className="bg-background border-border/40 text-foreground focus-visible:ring-amber-500"
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
                        className="text-muted-foreground hover:text-foreground"
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
                          className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-all duration-200"
                        >
                          <div className="space-y-3 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <StatusBadge domain="risk" status={risk.severity} />
                              <StatusBadge domain="risk" status={risk.status} />
                              <span className="text-[10px] text-muted-foreground">
                                Logged {formatDate(risk.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-semibold text-foreground">{risk.title}</h3>
                              <p className="text-xs text-muted-foreground font-light leading-relaxed">{risk.description}</p>
                            </div>

                            {risk.mitigationPlan && (
                              <div className="p-3 rounded-lg bg-background border border-border/40 text-xs text-muted-foreground font-light">
                                <span className="font-semibold text-foreground block mb-1">Mitigation Plan:</span>
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
                            >
                              Update Status
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Mitigate Dialog */}
                    <Dialog open={isMitigateDialogOpen} onOpenChange={setIsMitigateDialogOpen}>                        <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Update Risk & Mitigation</DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            Update the risk mitigation action plan or mark the risk as mitigated/closed.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedRisk && (
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="mitigationStatus" className="text-foreground">Risk Status</Label>
                                <Select 
                                  value={mitigationStatus} 
                                  onValueChange={(val: any) => setMitigationStatus(val)}
                                  disabled={isUpdatingRisk}
                                >
                                  <SelectTrigger className="bg-background border-border/40 text-foreground focus-visible:ring-blue-500">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-border/40 text-foreground">
                                    <SelectItem value="open">Open (Active Risk)</SelectItem>
                                    <SelectItem value="mitigated">Mitigated (Plan in action)</SelectItem>
                                    <SelectItem value="closed">Closed (No longer a threat)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="mitigationPlan" className="text-foreground">Mitigation Actions</Label>
                                <Textarea
                                  id="mitigationPlan"
                                  placeholder="Update details of mitigation steps taken..."
                                  rows={4}
                                  className="bg-background border-border/40 text-foreground focus-visible:ring-blue-500"
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
                            className="text-muted-foreground hover:text-foreground"
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
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                    <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-light">No risks logged for this project workspace.</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsRiskDialogOpen(true)}
                      className="mt-4 rounded-lg"
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
