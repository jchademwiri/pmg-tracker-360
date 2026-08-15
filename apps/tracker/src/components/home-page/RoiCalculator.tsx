'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calculator, Sparkles, ArrowRight, TrendingUp, Clock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RoiCalculator() {
  const [annualTenders, setAnnualTenders] = useState(20);
  const [avgPoValue, setAvgPoValue] = useState(3500000);
  const [activeProjects, setActiveProjects] = useState(3);

  // Computed projections
  const hoursPerMonthSaved = Math.round((annualTenders * 10) / 12);
  const projectedAnnualPoVolume = activeProjects * avgPoValue;
  const projectedQuarterlyCashflow = Math.round(projectedAnnualPoVolume / 4);

  return (
    <section id="projections-calculator" className="py-24 border-t border-border/40 bg-secondary/15 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Interactive PO & Cashflow Projection Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Project Your Cashflow & Time Savings
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            See how managing your active tenders and awarded project POs gives you clear cashflow forecasting and eliminates administrative overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-center">
          {/* Sliders Input Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-xl space-y-6 text-left">
            {/* Slider 1: Annual Tenders */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="annual-tenders-calc" className="font-bold text-foreground">
                  Tenders Submitted Per Year
                </label>
                <span className="font-mono text-base font-extrabold text-amber-400 tabular-nums">
                  {annualTenders} bids / year
                </span>
              </div>
              <input
                id="annual-tenders-calc"
                type="range"
                min="4"
                max="80"
                step="2"
                value={annualTenders}
                onChange={(e) => setAnnualTenders(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>4 bids</span>
                <span>40 bids</span>
                <span>80+ bids</span>
              </div>
            </div>

            {/* Slider 2: Average PO Value */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="avg-po-calc" className="font-bold text-foreground">
                  Average PO Value per Won Project (ZAR)
                </label>
                <span className="font-mono text-base font-extrabold text-amber-400 tabular-nums">
                  R&nbsp;{(avgPoValue / 1000000).toFixed(1)}M
                </span>
              </div>
              <input
                id="avg-po-calc"
                type="range"
                min="500000"
                max="20000000"
                step="500000"
                value={avgPoValue}
                onChange={(e) => setAvgPoValue(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>R 500K</span>
                <span>R 10M</span>
                <span>R 20M+</span>
              </div>
            </div>

            {/* Slider 3: Active Awarded Projects */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="active-proj-calc" className="font-bold text-foreground">
                  Active Awarded Projects
                </label>
                <span className="font-mono text-base font-extrabold text-amber-400 tabular-nums">
                  {activeProjects} {activeProjects === 1 ? 'project' : 'projects'}
                </span>
              </div>
              <input
                id="active-proj-calc"
                type="range"
                min="1"
                max="10"
                step="1"
                value={activeProjects}
                onChange={(e) => setActiveProjects(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>1 project</span>
                <span>5 projects</span>
                <span>10+ projects</span>
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border-2 border-primary/50 bg-linear-to-b from-card via-card/90 to-background shadow-2xl shadow-primary/10 space-y-6 text-left relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-primary">
                Your Procurement Forecast
              </span>
              <h3 className="text-xl font-extrabold text-foreground">
                Controlled Cashflow & Time Reclaimed
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tracking Time Saved</div>
                    <div className="text-sm font-bold text-foreground">
                      ~{hoursPerMonthSaved}&nbsp;hours / month
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Zero Scrambling
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Coins className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Quarterly PO Inflow</div>
                    <div className="text-sm font-bold text-foreground tabular-nums">
                      R&nbsp;{projectedQuarterlyCashflow.toLocaleString('en-ZA')}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                  Forecasted
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Active PO Portfolio</div>
                    <div className="text-sm font-bold text-foreground tabular-nums">
                      R&nbsp;{projectedAnnualPoVolume.toLocaleString('en-ZA')}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                  Live Ledger
                </span>
              </div>
            </div>

            <Button size="lg" asChild className="w-full h-11 font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer">
              <Link href="/sign-up">
                <span>Start For Free & Project Your Cashflow</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
