'use client';

import { useState } from 'react';
import {
  Crown,
  CreditCard,
  Check,
  Sparkles,
  ShieldCheck,
  Building2,
  ClipboardList,
  History,
  CheckCircle2,
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
import { updateUserPlan } from '@/server/billing';
import { formatCurrency } from '@/lib/format';
import { calculateStatementAgeing, type StatementAgeingSummary } from '@/lib/statements';

interface BillingClientProps {
  currentPlan: string;
  usage: {
    organizations: number;
    tenders: number;
    storage: number;
  };
}

interface PlanDetails {
  id: 'free' | 'starter' | 'pro';
  name: string;
  price: number;
  maxOrgs: number;
  projects: string;
  support: string;
  features: string[];
  color: string;
  popular?: boolean;
  description: string;
}

interface InvoiceLog {
  id: string;
  date: string;
  dueDate: string;
  description: string;
  amount: number;
  balanceDue: number;
  status: 'Paid' | 'Open' | 'Overdue';
  receipt: string;
}

const ageingLabels: Array<[keyof StatementAgeingSummary, string]> = [
  ['current', 'Current'],
  ['days1To30', '1-30 Days'],
  ['days31To60', '31-60 Days'],
  ['days61To90', '61-90 Days'],
  ['days90Plus', '90+ Days'],
  ['totalDue', 'Total Due'],
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderStatementPdfHtml({
  invoice,
  ageingSummary,
}: {
  invoice: InvoiceLog;
  ageingSummary: StatementAgeingSummary;
}) {
  const ageingHeader = ageingLabels
    .map(([, label]) => `<th>${escapeHtml(label)}</th>`)
    .join('');
  const ageingValues = ageingLabels
    .map(([key]) => `<td>${formatCurrency(ageingSummary[key], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}</td>`)
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(invoice.id)} Statement</title>
    <style>
      @page { margin: 18mm; }
      * { box-sizing: border-box; }
      body {
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.45;
        margin: 0;
      }
      .header {
        align-items: flex-start;
        border-bottom: 2px solid #111827;
        display: flex;
        justify-content: space-between;
        padding-bottom: 18px;
      }
      h1 {
        font-size: 26px;
        letter-spacing: 0;
        margin: 0 0 8px;
      }
      h2 {
        font-size: 14px;
        margin: 28px 0 8px;
      }
      .muted { color: #6b7280; }
      .summary {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, 1fr);
        margin: 22px 0;
      }
      .box {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 10px;
      }
      .label {
        color: #6b7280;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .value {
        font-size: 16px;
        font-weight: 700;
        margin-top: 3px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th {
        background: #f3f4f6;
        color: #374151;
        font-size: 11px;
        text-align: left;
      }
      th, td {
        border: 1px solid #d1d5db;
        padding: 8px;
      }
      .right { text-align: right; }
      .center { text-align: center; }
      .ageing th,
      .ageing td {
        text-align: right;
        white-space: nowrap;
      }
      .ageing th:last-child,
      .ageing td:last-child {
        font-weight: 700;
      }
      .notes {
        border-top: 1px solid #d1d5db;
        color: #6b7280;
        margin-top: 28px;
        padding-top: 12px;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>Statement</h1>
        <div class="muted">PMG Tracker 360</div>
      </div>
      <div class="right">
        <strong>${escapeHtml(invoice.id)}</strong><br />
        <span class="muted">Statement date: ${escapeHtml(invoice.date)}</span>
      </div>
    </div>

    <div class="summary">
      <div class="box">
        <div class="label">Status</div>
        <div class="value">${escapeHtml(invoice.status)}</div>
      </div>
      <div class="box">
        <div class="label">Amount</div>
        <div class="value">${formatCurrency(invoice.amount)}</div>
      </div>
      <div class="box">
        <div class="label">Balance Due</div>
        <div class="value">${formatCurrency(invoice.balanceDue, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</div>
      </div>
    </div>

    <h2>Transactions</h2>
    <table>
      <thead>
        <tr>
          <th>Transaction ID</th>
          <th>Billing Date</th>
          <th>Due Date</th>
          <th>Description</th>
          <th class="right">Amount</th>
          <th class="right">Balance Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(invoice.id)}</td>
          <td>${escapeHtml(invoice.date)}</td>
          <td>${escapeHtml(invoice.dueDate)}</td>
          <td>${escapeHtml(invoice.description)}</td>
          <td class="right">${formatCurrency(invoice.amount)}</td>
          <td class="right">${formatCurrency(invoice.balanceDue, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
        </tr>
      </tbody>
    </table>

    <h2>Ageing Summary</h2>
    <table class="ageing">
      <thead>
        <tr>${ageingHeader}</tr>
      </thead>
      <tbody>
        <tr>${ageingValues}</tr>
      </tbody>
    </table>

    <div class="notes">
      Outstanding balances are grouped by invoice due date. Paid receipts show zero outstanding ageing.
    </div>
  </body>
</html>`;
}

export default function BillingClient({ currentPlan, usage }: BillingClientProps) {
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
      projects: '0 Active Projects',
      support: 'Community Support',
      description: 'Perfect for getting started',
      features: [
        '1 Organization Ownership',
        'Basic Tender Tracking',
        '0 Active Projects',
        'Community Support',
        '100 MB Storage Cap',
      ],
      color: 'border-slate-200 dark:border-slate-800 bg-card',
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: 249,
      maxOrgs: 1,
      projects: '2 Active Projects',
      support: 'Email Support',
      description: 'For freelancers & consultants',
      features: [
        '1 Organization Ownership',
        'Unlimited Tenders Tracked',
        '2 Active Projects',
        'Email Support',
        '5 GB Secure Cloud Storage',
        'Auto-verification Fallbacks',
      ],
      color: 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10',
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 499,
      maxOrgs: 2,
      projects: '5 Active Projects',
      support: 'Priority 24/7 Support',
      description: 'For growing teams',
      features: [
        '2 Organization Ownerships',
        'Unlimited Tenders Tracked',
        '5 Active Projects',
        'Priority 24/7 Support',
        '20 GB Secure Cloud Storage',
        'Dynamic Access Controls (RBAC)',
        'Analytics Dashboard Reports',
      ],
      color: 'border-primary bg-primary/5 shadow-lg relative',
    },
  ];

  // 1. Plan Upgrade / Downgrade Selection Action
  const handleSelectPlan = async (targetPlanId: 'free' | 'starter' | 'pro') => {
    if (targetPlanId === activePlan) {
      toast.info(`You are already subscribed to the ${planTiers.find(p => p.id === targetPlanId)?.name || targetPlanId}.`);
      return;
    }

    const targetPlanDetails = planTiers.find((p) => p.id === targetPlanId);
    const targetMaxOrgs = targetPlanDetails?.maxOrgs || 1;

    // Downgrade Safeguard: Block if current owned org count exceeds target plan capacity
    if (usage.organizations > targetMaxOrgs) {
      toast.error('Subscription Downgrade Prevented', {
        description: `You currently own ${usage.organizations} organizations, but the ${targetPlanDetails?.name} limit is ${targetMaxOrgs} organization. Please delete or archive one of your organizations first.`,
        duration: 5000,
      });
      return;
    }

    setLoadingPlan(targetPlanId);
    toast.loading(`Processing subscription payment to ${planTiers.find(p => p.id === targetPlanId)?.name}...`);

    try {
      // Simulate API latency/Checkout Gateway processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await updateUserPlan(targetPlanId);

      if (result.success) {
        setActivePlan(targetPlanId);
        toast.dismiss();
        toast.success(`Successfully switched to the ${planTiers.find(p => p.id === targetPlanId)?.name}!`, {
          description: `Your limits and project active privileges have been updated dynamically.`,
        });
        
        // Force full page reload to flush cache and reload cookie headers
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

  const currentPlanDetails = planTiers.find((p) => p.id === activePlan) || planTiers[0];
  const maxOrganizations = currentPlanDetails.maxOrgs;
  const orgUsagePercent = Math.min((usage.organizations / maxOrganizations) * 100, 100);

  // Mock invoice/billing log records
  const invoiceLogs: InvoiceLog[] = [
    {
      id: 'INV-2026-004',
      date: 'May 01, 2026',
      dueDate: 'May 01, 2026',
      description: 'PMG Tracker 360 Plan (Pro Tier)',
      amount: 499,
      balanceDue: 0,
      status: 'Paid' as const,
      receipt: '#',
    },
    {
      id: 'INV-2026-003',
      date: 'Apr 01, 2026',
      dueDate: 'Apr 01, 2026',
      description: 'PMG Tracker 360 Plan (Pro Tier)',
      amount: 499,
      balanceDue: 0,
      status: 'Paid' as const,
      receipt: '#',
    },
    {
      id: 'INV-2026-002',
      date: 'Mar 01, 2026',
      dueDate: 'Mar 01, 2026',
      description: 'PMG Tracker 360 Plan (Starter Tier)',
      amount: 249,
      balanceDue: 0,
      status: 'Paid' as const,
      receipt: '#',
    },
    {
      id: 'INV-2026-001',
      date: 'Feb 01, 2026',
      dueDate: 'Feb 01, 2026',
      description: 'PMG Tracker 360 Plan (Starter Tier)',
      amount: 249,
      balanceDue: 0,
      status: 'Paid' as const,
      receipt: '#',
    },
  ].filter((inv) => {
    if (activePlan === 'free') return false; // Free plans don't show invoices
    if (activePlan === 'starter') return inv.amount <= 249;
    return true;
  });

  const handleDownloadPdf = (invoice: InvoiceLog) => {
    const ageingSummary = calculateStatementAgeing(
      [{ dueDate: invoice.dueDate, balanceDue: invoice.balanceDue }],
      new Date()
    );
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      toast.error('Please allow popups to export the PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(
      renderStatementPdfHtml({ invoice, ageingSummary })
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    toast.success(`Statement ${invoice.id} opened for PDF export.`);
  };

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
              Manage your plan, review usage limits, and view your billing receipts.
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
              Active Plan Status
            </CardTitle>
            <CardDescription>
              Review your current plan quotas and limits
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
                  {activePlan === 'free' ? 'Free Forever' : `${formatCurrency(currentPlanDetails.price)} / month`}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Renewal date: Jun 01, 2026 (Simulated)
                </p>
              </div>
            </div>

            {/* Quota Progress Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Organization Ownerships
                  </span>
                  <span className="font-bold">
                    {usage.organizations} / {maxOrganizations}
                  </span>
                </div>
                <Progress value={orgUsagePercent} className="h-2.5" />
                <p className="text-xs text-muted-foreground">
                  You are utilizing {usage.organizations} of {maxOrganizations} allowed organization ownerships.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    Active Tenders Tracked
                  </span>
                  <span className="font-bold">{usage.tenders} / Unlimited</span>
                </div>
                <Progress value={100} className="h-2.5 bg-emerald-500" />
                <p className="text-xs text-muted-foreground">
                  Your current tier permits unlimited tracked tenders.
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
                <span className="font-bold">Sandbox Simulated Mode</span>
                <p className="text-muted-foreground mt-0.5">Upgrade simulation securely saves settings directly to PostgreSQL databases without firing checkout charges.</p>
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
                    className="w-full font-semibold transition-all duration-300"
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
      {invoiceLogs.length > 0 && (
        <Card className="shadow-sm border border-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Receipts & Billing History
            </CardTitle>
            <CardDescription>
              Review past transactions and download invoice files
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
                  {invoiceLogs.map((inv) => (
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
                          onClick={() => handleDownloadPdf(inv)}
                          className="text-primary hover:text-primary/80 font-bold p-0 h-auto cursor-pointer"
                        >
                          Download PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
