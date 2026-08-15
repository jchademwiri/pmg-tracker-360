import Link from 'next/link';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClosingCtaSection() {
  return (
    <section className="py-20 md:py-24 border-t border-border/40 bg-radial from-primary/15 via-background to-background relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Keep Your Tenders & POs in Perfect Order</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
          Never Miss Another Tender Deadline or Validity Expiry.
        </h2>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground text-pretty">
          Track your submissions, receive automated briefing alarms, manage your awarded POs, and download presentation reports in seconds.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-sm mx-auto pt-2">
          <Button
            size="lg"
            asChild
            className="w-full h-12 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Link href="/sign-up">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Start For Free</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {/* Micro Guarantees */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground/90 pt-2">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>Free Forever Account</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>Free Upgrades During Beta</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>No Credit Card Required</span>
          </span>
        </div>
      </div>
    </section>
  );
}
