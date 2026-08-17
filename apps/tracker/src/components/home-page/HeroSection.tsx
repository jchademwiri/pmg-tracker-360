"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BellRing,
  Hourglass,
  PackageCheck,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

export function HeroSection() {
  const [selectedBeacon, setSelectedBeacon] = useState<
    "briefing" | "closing" | "validity" | "po"
  >("closing");

  const stages = [
    {
      id: "briefing" as const,
      label: "1. Briefing Alert",
      icon: BellRing,
      color: "text-amber-400",
    },
    {
      id: "closing" as const,
      label: "2. Closing Siren",
      icon: Clock,
      color: "text-rose-400",
    },
    {
      id: "validity" as const,
      label: "3. Validity Expiry",
      icon: Hourglass,
      color: "text-sky-300",
    },
    {
      id: "po" as const,
      label: "4. Awarded POs",
      icon: PackageCheck,
      color: "text-emerald-400",
    },
  ];

  return (
    <section className="relative isolate pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-radial from-secondary/40 via-background to-background">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[700px] rounded-full bg-primary/10 blur-[130px] opacity-70" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Top Announcement Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md">
            <span
              className="h-2 w-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            <span>
              Tender Reminders &bull; Validity Follow-ups &bull; PO Management
            </span>
          </div>

          {/* Headline with High-Contrast Typography */}
          <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
            Never Miss a Tender Deadline.{" "}
            <span className="text-amber-400">Manage Your Awarded POs.</span>
          </h1>

          {/* Concise Sub-headline */}
          <p className="mb-8 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
            Automated alerts for mandatory briefing sessions, 11:00 AM closing
            sirens, and 90-day validity follow-ups. Keep your submissions
            organized and track purchase orders on every project you win.
          </p>

          {/* Single High-Conversion Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-sm mb-4">
            <Button
              size="lg"
              asChild
              className="w-full h-12 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Link href="/sign-up">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Start For Free</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {/* Micro Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground/90 mb-12">
            <span className="inline-flex items-center gap-1.5">
              <Check
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              <span>Free Forever Account</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check
                className="h-3.5 w-3.5 text-amber-400"
                aria-hidden="true"
              />
              <span>Free Upgrades During Beta</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              <span>No Credit Card Required</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            COMPACT INTERACTIVE TIMELINE PREVIEW (WAI-ARIA Tablist)
        ========================================================================= */}
        <div className="rounded-3xl border border-white/10 bg-card/70 backdrop-blur-2xl p-5 sm:p-7 shadow-2xl shadow-black/50 text-left max-w-4xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Live Tender & PO Operations Feed
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              Click any stage below to inspect:
            </div>
          </div>

          {/* 4 Interactive Stage Tabs */}
          <div
            role="tablist"
            aria-label="Tender & PO Operations Stages"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
          >
            {stages.map((stage) => {
              const isSelected = selectedBeacon === stage.id;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.id}
                  id={`tab-${stage.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={`panel-${stage.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedBeacon(stage.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "bg-primary/15 border-primary shadow-sm"
                      : "bg-muted/20 border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${stage.color}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-xs font-bold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Detail Display / Tab Panel */}
          <div
            id={`panel-${selectedBeacon}`}
            role="tabpanel"
            aria-labelledby={`tab-${selectedBeacon}`}
            className="p-4 rounded-2xl bg-muted/30 border border-border/70 transition-all duration-200"
          >
            {selectedBeacon === "briefing" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    Tender #ESK-2026-892
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
                    Briefing in 2 Days (10:00 AM)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Eskom Kendal Substation Maintenance & Feeder Overhaul
                </h4>
                <p className="text-xs text-muted-foreground">
                  Compulsory site inspection. Calendar synced with your
                  estimating team.
                </p>
              </div>
            )}

            {selectedBeacon === "closing" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-400">
                    Tender #SAN-2026-094
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/60">
                    Closing in 47h : 18m
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  SANRAL N2 Road Rehabilitation & Bridge Maintenance
                </h4>
                <p className="text-xs text-muted-foreground">
                  Strict 11:00 AM submission cutoff. SBD 4, SBD 6.1, CSD report
                  and SARS Pin verified.
                </p>
              </div>
            )}

            {selectedBeacon === "validity" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-300">
                    Tender #JHB-2026-550
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-700/60">
                    90-Day Validity (Day 76 of 90)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  City of Joburg Bulk Water Infrastructure Rehabilitation
                </h4>
                <p className="text-xs text-muted-foreground">
                  Submitted 76 days ago with no award notice. Automated trigger
                  prompted follow-up inquiry with SCM.
                </p>
              </div>
            )}

            {selectedBeacon === "po" && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    PO #45009823 (R 3,450,000)
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                    Milestone 2 Delivered
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Rand Water Valve Replacements & Civil Works
                </h4>
                <p className="text-xs text-muted-foreground">
                  Converted from won tender into active project. Line-item
                  deliveries and cash projections updated.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
