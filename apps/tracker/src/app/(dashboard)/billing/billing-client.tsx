'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Building2,
  ClipboardList,
  History,
  CheckCircle2,
  FolderKanban,
  HardDrive,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { updateUserPlan, BillingInvoice } from '@/server/billing';
import { formatCurrency } from '@/lib/format';

interface BillingClientProps {
  currentPlan: string;
  userUpdatedAt?: Date | string;
  usage: {
    organizations: number;
    tenders: number;
    lifetimeTenders?: number;
    projects: number;
    storage: number;
  };
  invoices: BillingInvoice[];
}

interface PlanDetails {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: number;
  maxOrgs: number;
  maxTenders: number | 'Unlimited';
  maxProjects: number;
  maxStorageMb: number;
  projects: string;
  support: string;
  features: string[];
  color: string;
  popular?: boolean;
  description: string;
}

export default function BillingClient({
  currentPlan,
  userUpdatedAt,
  usage,
  invoices = [],
}: BillingClientProps) {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<'free' | 'starter' | 'pro'>(
    (currentPlan.toLowerCase() as any) || 'free'
  );
  const [loadingPlan, setLoadingPlan] = useState<'free' | 'starter' | 'pro' | null>(null);

  const planTiers: PlanDetails[] = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      maxOrgs: 1,
      maxTenders: 10,
      maxProjects: 0,
      maxStorageMb: 100,
      projects: '0 Active Projects',
      support: 'Community Support',
      description: 'Perfect for getting started',
      features: [
        '1 Organization Ownership',
        'Basic Tender Tracking',
        '10 Tenders / Month',
        '0 Active Projects',
        '100 MB Storage Cap',
        'Community Support',
      ],
      color: 'border-slate-200 dark:border-slate-800 bg-card',
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: 249,
      maxOrgs: 1,
      maxTenders: 20,
      maxProjects: 2,
      maxStorageMb: 1000,
      projects: '2 Active Projects',
      support: 'Email Support',
      description: 'For freelancers & consultants',
      features: [
        '1 Organization Ownership',
        'Advanced Tender Tracking',
        '20 Tenders / Month',
        '2 Active Projects',
        '1 GB Secure Storage',
        'Email Support',
      ],
      color: 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10',
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 499,
      maxOrgs: 2,
      maxTenders: 'Unlimited',
      maxProjects: 5,
      maxStorageMb: 10000,
      projects: '5 Active Projects',
      support: 'Priority 24/7 Support',
      description: 'For growing teams',
      features: [
        '2 Organization Ownerships',
        'Unlimited Tenders Tracked',
        '5 Active Projects',
        '10 GB Secure Storage',
        'Priority 24/7 Support',
        'Dynamic Access Controls (RBAC)',
        'Analytics Dashboard Reports',
      ],
      color: 'border-primary bg-primary/5 shadow-lg relative',
      popular: true,
    },
  ];

  // Calculate Next Monthly Renewal Date dynamically
  const calculateRenewalDate = () => {
    const latestInvoiceDate = invoices[0]?.date;
    const baseDate = latestInvoiceDate
      ? new Date(latestInvoiceDate)
      : userUpdatedAt
        ? new Date(userUpdatedAt)
        : new Date();
    const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const renewalDateString = calculateRenewalDate();

  // Downgrade Safeguard Action
  const handleSelectPlan = async (targetPlanId: 'free' | 'starter' | 'pro') => {
    if (targetPlanId === activePlan) {
      toast.info(
        `You are already subscribed to the ${
          planTiers.find((p) => p.id === targetPlanId)?.name || targetPlanId
        }.`
      );
      return;
    }

    const targetPlanDetails = planTiers.find((p) => p.id === targetPlanId);
    if (!targetPlanDetails) return;

    // Downgrade Safeguard Validations
    if (usage.organizations > targetPlanDetails.maxOrgs) {
      toast.error('Subscription Plan Change Prevented', {
        description: `You currently own ${usage.organizations} organizations, but the ${targetPlanDetails.name} limit is ${targetPlanDetails.maxOrgs}. Please delete or archive an organization first.`,
        duration: 5000,
      });
      return;
    }

    if (usage.projects > targetPlanDetails.maxProjects) {
      toast.error('Subscription Plan Change Prevented', {
        description: `You currently have ${usage.projects} active projects, but the ${targetPlanDetails.name} limit is ${targetPlanDetails.maxProjects}. Please complete or archive projects first.`,
        duration: 5000,
      });
      return;
    }

    if (typeof targetPlanDetails.maxTenders === 'number' && usage.tenders > targetPlanDetails.maxTenders) {
      toast.error('Subscription Plan Change Prevented', {
        description: `You have created ${usage.tenders} tenders this month, which exceeds the ${targetPlanDetails.name} limit of ${targetPlanDetails.maxTenders} tenders per month.`,
        duration: 5000,
      });
      return;
    }

    setLoadingPlan(targetPlanId);
    toast.loading(`Processing subscription update to ${targetPlanDetails.name}...`);

    try {
      const result = await updateUserPlan(targetPlanId);

      if (result.success) {
        setActivePlan(targetPlanId);
        toast.dismiss();
        toast.success(`Successfully switched to the ${targetPlanDetails.name}!`, {
          description: `Your monthly quotas and features have been updated dynamically in PostgreSQL database.`,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.dismiss();
        toast.error(result.error || 'Failed to update plan.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error switching plan:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // Download Receipt Generator
  const handleDownloadReceipt = (inv: BillingInvoice) => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tendertrack360.co.za';
      const receiptContent = `=================================================
PMG TRACKER 360 - SUBSCRIPTION RECEIPT
=================================================
Receipt ID    : ${inv.id}
Date          : ${inv.date}
Status        : ${inv.status}
Plan          : ${inv.description}
Amount Paid   : R ${inv.amount}.00 ZAR
Payment Method: Electronic Funds Transfer / Card
=================================================
Thank you for subscribing to PMG Tracker 360.
Website: ${appUrl}
Support: support@tendertrack360.co.za
=================================================`;

      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded receipt ${inv.id}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download receipt');
    }
  };

  const currentPlanDetails = planTiers.find((p) => p.id === activePlan) || planTiers[0];

  // Live Metric Percentages
  const maxOrgs = currentPlanDetails.maxOrgs;
  const orgUsagePercent = Math.min((usage.organizations / maxOrgs) * 100, 100);

  const maxTenders = currentPlanDetails.maxTenders;
  const tendersUsagePercent =
    typeof maxTenders === 'number' ? Math.min((usage.tenders / maxTenders) * 100, 100) : 0;

  const maxProjects = currentPlanDetails.maxProjects;
  const projectsUsagePercent =
    maxProjects > 0 ? Math.min((usage.projects / maxProjects) * 100, 100) : usage.projects > 0 ? 100 : 0;

  const maxStorage = currentPlanDetails.maxStorageMb;
  const storageUsagePercent = Math.min((usage.storage / maxStorage) * 100, 100);

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-6xl font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage your subscription plan, view live PostgreSQL database limits, and download billing receipts.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Billing Status & Limits Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border border-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Active Plan Status & DB Quotas
            </CardTitle>
            <CardDescription>
              Live database limits and subscription details for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-muted/30 p-4 rounded-xl border border-muted/50 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Subscription Tier
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {currentPlanDetails.name}
                  </h3>
                  {activePlan === 'pro' && (
                    <Badge className="bg-primary/20 hover:bg-primary/20 text-primary font-semibold border-none flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]">
                      <Crown className="h-3 w-3 fill-current" />
                      MOST POPULAR
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-muted-foreground">
                  {activePlan === 'free'
                    ? 'Free Forever'
                    : `${formatCurrency(currentPlanDetails.price)} / month`}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Renewal date: {renewalDateString}
                </p>
              </div>
            </div>

            {/* Quota Progress Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Orgs */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Organization Ownerships
                  </span>
                  <span className="font-bold">
                    {usage.organizations} / {maxOrgs}
                  </span>
                </div>
                <Progress value={orgUsagePercent} className="h-2.5" />
                <p className="text-xs text-muted-foreground">
                  You own {usage.organizations} of {maxOrgs} allowed organization ownerships.
                </p>
              </div>

              {/* Tenders */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    Monthly Tenders Tracked
                  </span>
                  <span className="font-bold">
                    {usage.tenders} / {typeof maxTenders === 'number' ? `${maxTenders}` : 'Unlimited'}
                  </span>
                </div>
                <Progress
                  value={tendersUsagePercent}
                  className={`h-2.5 ${
                    typeof maxTenders === 'number' && usage.tenders >= maxTenders ? 'bg-red-500' : ''
                  }`}
                />
                <p className="text-xs text-muted-foreground">
                  {typeof maxTenders === 'number'
                    ? `${usage.tenders} of ${maxTenders} monthly tenders created.`
                    : 'Your Pro tier permits unlimited monthly tenders.'}
                </p>
              </div>

              {/* Projects */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FolderKanban className="h-4 w-4" />
                    Active Projects
                  </span>
                  <span className="font-bold">
                    {usage.projects} / {maxProjects}
                  </span>
                </div>
                <Progress value={projectsUsagePercent} className="h-2.5" />
                <p className="text-xs text-muted-foreground">
                  {maxProjects === 0
                    ? 'Active projects require Starter or Pro tier.'
                    : `${usage.projects} of ${maxProjects} allowed active projects.`}
                </p>
              </div>

              {/* Storage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    Storage Space
                  </span>
                  <span className="font-bold">
                    {usage.storage} MB / {maxStorage >= 1000 ? `${maxStorage / 1000} GB` : `${maxStorage} MB`}
                  </span>
                </div>
                <Progress value={storageUsagePercent} className="h-2.5" />
                <p className="text-xs text-muted-foreground">
                  {usage.storage} MB consumed by stored documents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support & Feature Summary */}
        <Card className="shadow-sm border border-muted/50 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Plan Benefits
            </CardTitle>
            <CardDescription>Included privileges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Project Capacity</span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {currentPlanDetails.projects}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Support Level</span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {currentPlanDetails.support}
              </p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg text-xs flex gap-2 items-start mt-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Database Backed Mode</span>
                <p className="text-muted-foreground mt-0.5">
                  Plan changes persist securely directly to your PostgreSQL database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Plans Grid Selection */}
      <div className="space-y-4">
        <div className="text-left space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Available Subscription Tiers</h2>
          <p className="text-sm text-muted-foreground">Select a pricing card below to upgrade or adjust your platform plan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planTiers.map((tier) => {
            const isActive = activePlan === tier.id;
            return (
              <Card
                key={tier.id}
                className={`flex flex-col justify-between overflow-hidden shadow-sm border transition-all duration-300 hover:shadow-md ${tier.color} ${
                  isActive ? 'ring-2 ring-primary border-primary' : 'border-muted/50'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-bold px-3 py-1 text-[10px] rounded-bl-lg tracking-wider">
                    POPULAR
                  </div>
                )}
                <CardHeader className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      {tier.name}
                    </span>
                    {isActive && (
                      <Badge className="bg-primary text-primary-foreground font-bold hover:bg-primary flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px] border-none">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {formatCurrency(tier.price)}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">/month</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <Separator className="my-4 bg-muted/60" />
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {tier.features.map((feat, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button
                    type="button"
                    onClick={() => handleSelectPlan(tier.id)}
                    disabled={isActive || loadingPlan !== null}
                    className="w-full font-semibold transition-all duration-300 cursor-pointer"
                    variant={isActive ? 'outline' : tier.id === 'pro' ? 'default' : 'secondary'}
                  >
                    {loadingPlan === tier.id ? (
                      <span className="flex items-center gap-2">
                        Updating Plan...
                      </span>
                    ) : isActive ? (
                      'Current Active Plan'
                    ) : tier.price === 0 ? (
                      'Downgrade to Free'
                    ) : (
                      `Upgrade to ${tier.name.split(' ')[0]}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Billing History Invoices Section */}
      <Card className="shadow-sm border border-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Receipts & Billing History
          </CardTitle>
          <CardDescription>
            Review past transaction logs stored in PostgreSQL and download invoice receipts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <History className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No Billing Receipts Found</p>
              <p className="text-xs">
                You are currently on the Free Plan. Upgrade to Starter or Pro to manage billing transactions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-muted/50 bg-muted/20 text-muted-foreground font-semibold">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Billing Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount Paid</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/30">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-mono font-medium text-foreground">{inv.id}</td>
                      <td className="p-4 text-muted-foreground">{inv.date}</td>
                      <td className="p-4 text-foreground font-medium">{inv.description}</td>
                      <td className="p-4 text-right font-semibold text-foreground">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border-none text-[10px]">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(inv)}
                          className="text-primary hover:text-primary/80 font-bold p-0 h-auto cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Download className="h-3.5 w-3.5" /> Download Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
