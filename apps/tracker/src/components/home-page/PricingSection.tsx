import Link from 'next/link';
import { Check, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type SubscriptionPlan, DEFAULT_SUBSCRIPTION_PLANS } from '@pmg/db/plans-constants';

interface PricingSectionProps {
  plans?: SubscriptionPlan[];
}

export function PricingSection({ plans = DEFAULT_SUBSCRIPTION_PLANS }: PricingSectionProps) {
  const activePlans = plans.filter((p) => p.isActive);

  return (
    <section id="pricing" className="py-20 md:py-24 border-t border-border/40 bg-background scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Zero Risk. Free Upgrades During Beta.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty">
            Choose the plan that fits your bidding volume. All paid features are 100% unlocked for free during our public beta without a credit card.
          </p>

          {/* Beta Guarantee Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold shadow-xs">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>🎉 Public Beta Special: All plans unlocked for free testing. No credit card required!</span>
          </div>
        </div>

        {/* 3-Column Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {activePlans.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 text-left ${
                tier.popular
                  ? 'border-2 border-primary bg-linear-to-b from-primary/10 via-card/85 to-card shadow-2xl shadow-primary/15 md:scale-105 z-10'
                  : 'border border-border/80 bg-card/60 hover:border-border/90'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold tracking-wider uppercase shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>{tier.badgeText || 'Most Popular'}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{tier.description}</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-muted-foreground">R</span>
                    <span className="text-4xl font-extrabold text-foreground font-mono tabular-nums">
                      {tier.priceZar}
                    </span>
                  </div>
                  <div className="text-xs text-amber-400 font-medium mt-1">
                    / {tier.period}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Included Capabilities:
                  </div>
                  {Array.isArray(tier.features) &&
                    (tier.features as string[]).map((feature: string) => (
                      <div key={feature} className="flex items-start gap-2 text-xs text-foreground/90 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                        <span>{feature}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-border/40">
                <Button
                  size="default"
                  asChild
                  className={`w-full h-11 font-bold gap-1.5 cursor-pointer shadow-sm ${
                    tier.popular
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-muted/80 hover:bg-muted text-foreground border border-border/80'
                  }`}
                >
                  <Link href={`/sign-up?plan=${tier.id}`}>
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
