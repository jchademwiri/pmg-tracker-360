'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HardDrive,
  Database,
  FileText,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  FolderKanban,
  ClipboardList,
  Truck,
  FileCode,
  Check,
  Zap,
  Loader2,
  Crown,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatFileSize, formatDate } from '@/lib/format';
import {
  type StorageAnalyticsData,
  type StorageDocumentItem,
  updateOrganizationPlan,
} from '@/server/storage';

interface StorageDashboardProps {
  organizationId: string;
  data: StorageAnalyticsData;
}

const CATEGORY_COLORS: Record<string, string> = {
  tenders: '#3b82f6', // blue
  projects: '#10b981', // emerald
  purchase_orders: '#8b5cf6', // purple
  extensions: '#f59e0b', // amber
  general: '#64748b', // slate
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: '#ef4444', // red
  excel: '#10b981', // emerald
  word: '#2563eb', // blue
  image: '#ec4899', // pink
  other: '#6b7280', // gray
};

interface PlanTier {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: string;
  period: string;
  storageMb: number;
  storageLabel: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 'R 0',
    period: 'forever free',
    storageMb: 100,
    storageLabel: '100 MB Storage',
    description: 'Essential storage for solo contractors evaluating tenders.',
    features: [
      '100 MB Cloudflare R2 storage',
      'Up to 10 active tenders',
      'Standard document uploads (PDF, Word, Excel)',
      'Community support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter Tier',
    price: 'R 199',
    period: 'per month',
    storageMb: 1000,
    storageLabel: '1 GB Storage (1,000 MB)',
    description: 'Expanded capacity for growing teams managing multiple bids.',
    features: [
      '1 GB Cloudflare R2 storage (10x capacity)',
      'Unlimited active tenders & projects',
      'Automated email deadline alerts',
      'Priority ticket support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Professional',
    price: 'R 499',
    period: 'per month',
    storageMb: 10000,
    storageLabel: '10 GB Storage (10,000 MB)',
    description: 'High-capacity workspace for established contractors & suppliers.',
    features: [
      '10 GB Cloudflare R2 storage (100x capacity)',
      'Full purchase order & delivery note tracking',
      'Custom document naming & automated signed URLs',
      'Dedicated compliance manager support',
    ],
    popular: true,
  },
];

function getFileIcon(mimeType: string) {
  const mime = mimeType.toLowerCase();
  if (mime.includes('pdf')) {
    return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
  }
  if (mime.includes('excel') || mime.includes('spreadsheet') || mime.includes('csv')) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
  if (mime.includes('word') || mime.includes('wordprocessingml')) {
    return <FileCode className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (mime.includes('image/')) {
    return <ImageIcon className="h-4 w-4 text-pink-500 shrink-0" />;
  }
  return <File className="h-4 w-4 text-slate-400 shrink-0" />;
}

function getEntityBadge(doc: StorageDocumentItem) {
  switch (doc.entityType) {
    case 'tender':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <ClipboardList className="h-3 w-3" />
          <span>{doc.entityLabel || 'Tender'}</span>
        </span>
      );
    case 'project':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <FolderKanban className="h-3 w-3" />
          <span>{doc.entityLabel || 'Project'}</span>
        </span>
      );
    case 'purchaseOrder':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Truck className="h-3 w-3" />
          <span>{doc.entityLabel || 'PO'}</span>
        </span>
      );
    case 'extension':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          <span>{doc.entityLabel || 'Extension'}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <File className="h-3 w-3" />
          <span>General</span>
        </span>
      );
  }
}

export function StorageDashboard({ organizationId, data }: StorageDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPlanAction, setSelectedPlanAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'largest'>('recent');

  const currentPlanId = data.plan.toLowerCase() as PlanTier['id'];
  const isWarning = data.usedPercentage >= 75 && data.usedPercentage < 90;
  const isCritical = data.usedPercentage >= 90;

  const handlePlanChange = (targetPlan: PlanTier['id']) => {
    setSelectedPlanAction(targetPlan);
    startTransition(async () => {
      try {
        const result = await updateOrganizationPlan(organizationId, targetPlan);
        if (result.success) {
          toast.success(result.message || `Plan updated to ${targetPlan.toUpperCase()}`);
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to update plan.');
        }
      } catch (err: any) {
        toast.error(err.message || 'An error occurred while changing subscription plan.');
      } finally {
        setSelectedPlanAction(null);
      }
    });
  };

  // Prepare chart data for Category Pie Chart
  const categoryChartData = data.categoryStats
    .filter((cat) => cat.totalBytes > 0)
    .map((cat) => ({
      name: cat.label,
      value: cat.totalBytes,
      formattedSize: formatFileSize(cat.totalBytes),
      fileCount: cat.fileCount,
      color: CATEGORY_COLORS[cat.category] || '#64748b',
    }));

  // Prepare chart data for File Type Bar Chart
  const fileTypeChartData = data.fileTypeStats
    .filter((ft) => ft.totalBytes > 0)
    .map((ft) => ({
      name: ft.label,
      sizeMb: Math.round((ft.totalBytes / (1024 * 1024)) * 10) / 10,
      formattedSize: formatFileSize(ft.totalBytes),
      fileCount: ft.fileCount,
      color: FILE_TYPE_COLORS[ft.fileType] || '#6b7280',
    }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            <span>Storage & Documents</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor organization storage capacity, breakdown by workspace, file types, and manage 1-click subscription tiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 font-medium shadow-xs">
            <Link href="/billing">
              <Sparkles className="h-4 w-4 mr-1.5 text-amber-400" />
              Manage Billing
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9 font-medium shadow-xs">
            <Link href="/tenders">
              <FileText className="h-4 w-4 mr-1.5" />
              Manage Documents
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Capacity Banner */}
      <Card className="sticky top-0 z-20 overflow-hidden border-border/80 bg-card/95 backdrop-blur-md shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Storage Tier: <strong className="text-foreground uppercase">{data.plan}</strong>
                </span>
                {isCritical ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Storage Critical ({data.usedPercentage}%)
                  </span>
                ) : isWarning ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Storage Warning ({data.usedPercentage}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Capacity Healthy
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold tracking-tight">
                  {formatFileSize(data.usedBytes)}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  of {formatFileSize(data.planLimitBytes)} limit ({data.usedPercentage}% used)
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <Progress
                  value={data.usedPercentage}
                  className="h-3 rounded-full bg-muted/60"
                />
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>0 Bytes</span>
                  <span>75% Warning</span>
                  <span>{formatFileSize(data.planLimitBytes)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
              <div className="text-left md:text-right">
                <span className="text-xs text-muted-foreground">Available Space</span>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">
                  {formatFileSize(data.availableBytes)}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Need more volume? Upgrade your plan below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1-Click Subscription Plan Tier Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span>Subscription & Storage Tier Management</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Instantly upgrade or adjust your organization's storage volume with 1-click tier switching.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_TIERS.map((tier) => {
            const isCurrent = currentPlanId === tier.id;
            const isDowngrade =
              (currentPlanId === 'pro' && (tier.id === 'starter' || tier.id === 'free')) ||
              (currentPlanId === 'starter' && tier.id === 'free');
            const isUpgrade = !isCurrent && !isDowngrade;
            const isActing = selectedPlanAction === tier.id && isPending;

            return (
              <Card
                key={tier.id}
                className={`relative flex flex-col justify-between transition-all duration-200 ${
                  isCurrent
                    ? 'border-primary shadow-md bg-primary/5 ring-1 ring-primary/40'
                    : tier.popular
                      ? 'border-amber-500/50 shadow-sm bg-amber-500/5'
                      : 'border-border/60 hover:border-border'
                }`}
              >
                {tier.popular && !isCurrent && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-xs">
                    Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Active Plan
                  </span>
                )}

                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>{tier.name}</span>
                  </CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">
                      {tier.price}
                    </span>
                    <span className="text-xs text-muted-foreground">/{tier.period}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-muted/60 text-foreground w-fit mt-2">
                    <HardDrive className="h-3.5 w-3.5 text-primary" />
                    <span>{tier.storageLabel}</span>
                  </div>
                  <CardDescription className="text-xs mt-2 leading-relaxed">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    disabled={isCurrent || isPending}
                    variant={isCurrent ? 'secondary' : isUpgrade ? 'default' : 'outline'}
                    size="sm"
                    className={`w-full font-semibold cursor-pointer ${
                      isUpgrade && tier.popular
                        ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                        : isUpgrade
                          ? 'shadow-xs'
                          : ''
                    }`}
                    onClick={() => handlePlanChange(tier.id)}
                  >
                    {isActing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        <span>Updating Plan...</span>
                      </>
                    ) : isCurrent ? (
                      <span>Current Active Plan</span>
                    ) : isUpgrade ? (
                      <>
                        <Zap className="h-3.5 w-3.5 mr-1 text-amber-300" />
                        <span>1-Click Upgrade</span>
                      </>
                    ) : (
                      <span>Downgrade Tier</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Storage Used
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatFileSize(data.usedBytes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.usedPercentage}% of {data.planLimitMb >= 1000 ? `${data.planLimitMb / 1000} GB` : `${data.planLimitMb} MB`} quota
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Space
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-400">
              {formatFileSize(data.availableBytes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Remaining capacity for uploads
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{data.totalFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Stored across all workspaces
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average File Size
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatFileSize(data.avgFileSizeBytes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per document average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown Donut */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Workspace Distribution</CardTitle>
            <CardDescription className="text-xs">
              Storage consumption categorized by business area
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-muted-foreground italic">
                No documents uploaded yet
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: any) => [formatFileSize(Number(value)), 'Storage']}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 flex-1 w-full">
                  {data.categoryStats.map((cat) => {
                    const percentage =
                      data.usedBytes > 0
                        ? Math.round((cat.totalBytes / data.usedBytes) * 100)
                        : 0;
                    return (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b',
                            }}
                          />
                          <span className="font-medium text-foreground truncate">
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                          <span className="text-muted-foreground">{cat.fileCount} files</span>
                          <span className="font-bold text-foreground">
                            {formatFileSize(cat.totalBytes)} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Type Distribution Bar */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">File Format Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Storage consumption by file MIME type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fileTypeChartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-xs text-muted-foreground italic">
                No documents uploaded yet
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fileTypeChartData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <RechartsTooltip
                        formatter={(value: any) => [`${value} MB`, 'Size']}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="sizeMb" radius={[0, 4, 4, 0]}>
                        {fileTypeChartData.map((entry, index) => (
                          <Cell key={`cell-bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-3">
                  {data.fileTypeStats.map((ft) => (
                    <div key={ft.fileType} className="flex items-center justify-between p-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: FILE_TYPE_COLORS[ft.fileType] }}
                        />
                        <span className="text-muted-foreground truncate">{ft.label}</span>
                      </div>
                      <span className="font-mono font-medium">{formatFileSize(ft.totalBytes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Tables Section */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">Document Inventory</CardTitle>
            <CardDescription className="text-xs">
              Explore your organization's recent uploads and largest stored files.
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-fit">
            <TabsList className="h-8 p-0.5 bg-muted/60 text-xs">
              <TabsTrigger value="recent" className="h-7 text-xs px-3">
                Recent Uploads ({data.recentUploads.length})
              </TabsTrigger>
              <TabsTrigger value="largest" className="h-7 text-xs px-3">
                Top Largest Files ({data.largestFiles.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} className="w-full">
            {/* Recent Uploads Table */}
            <TabsContent value="recent" className="m-0 border-t border-border/40">
              {data.recentUploads.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  No document records found in this organization.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">File Name</TableHead>
                      <TableHead className="w-[20%]">Workspace Entity</TableHead>
                      <TableHead className="w-[15%]">Uploaded By</TableHead>
                      <TableHead className="w-[12%]">Size</TableHead>
                      <TableHead className="w-[13%]">Upload Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentUploads.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(doc.type)}
                            <span className="truncate" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getEntityBadge(doc)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {doc.uploadedByName || 'System'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold tabular-nums">
                          {formatFileSize(doc.size)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Largest Files Table */}
            <TabsContent value="largest" className="m-0 border-t border-border/40">
              {data.largestFiles.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  No document records found in this organization.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">File Name</TableHead>
                      <TableHead className="w-[20%]">Workspace Entity</TableHead>
                      <TableHead className="w-[15%]">Uploaded By</TableHead>
                      <TableHead className="w-[12%]">Size</TableHead>
                      <TableHead className="w-[13%]">Upload Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.largestFiles.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(doc.type)}
                            <span className="truncate" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getEntityBadge(doc)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {doc.uploadedByName || 'System'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                          {formatFileSize(doc.size)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
