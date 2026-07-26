'use client';

import { useState } from 'react';
import { Crown, Zap, ArrowLeft, ShieldAlert, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradeDialog } from '@/components/shared/dialogs/upgrade-dialog';
import Link from 'next/link';

type Props = {
  currentCount: number;
  maxCount?: number;
  plan?: string;
};

export default function QuotaExceededTenderGate({ currentCount, maxCount = 10, plan = 'free' }: Props) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(true);

  const planName = plan.toUpperCase();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <Link
        href="/tenders"
        className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tenders Register
      </Link>

      <div className="bg-card border-2 border-amber-500/40 dark:border-amber-500/30 rounded-2xl p-8 space-y-6 text-center shadow-xl">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
          <Crown className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Monthly Tender Limit Reached ({currentCount}/{maxCount})
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You have used all <strong>{maxCount} tenders</strong> allocated for this calendar month on the <strong>{planName} Plan</strong>.
            Upgrade your subscription plan to unlock more tender tracking capacity.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-accent/40 border border-border/60 text-left space-y-2 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            What happens when you upgrade:
          </div>
          <ul className="space-y-1.5 text-muted-foreground pl-5 list-disc">
            <li><strong>Higher Tender Limits</strong> — Get up to 20 tenders / month on Starter or Unlimited tenders on Pro.</li>
            <li><strong>Instant Plan Upgrade</strong> — Switch to Starter (R249) or Pro (R499) instantly.</li>
            <li><strong>Active Projects & Storage</strong> — Access up to 5 active projects and 10GB storage.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => setShowUpgradeDialog(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg cursor-pointer"
          >
            <Crown className="h-4 w-4 mr-2" /> Upgrade Subscription Plan
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/tenders">View Existing Tenders</Link>
          </Button>
        </div>
      </div>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentCount={currentCount}
        maxCount={maxCount}
        usageContext="tenders"
      />
    </div>
  );
}
