"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Hourglass,
  PackageCheck,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileText,
  Download,
  FileDown,
  Building,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type WorkflowTab = "briefings" | "validity" | "pos" | "projections" | "reports";

export function InteractiveProductShowcase() {
  const [activeTab, setActiveTab] = useState<WorkflowTab>("briefings");

  return (
    <section id="how-it-works" className="py-24 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Interactive Workflow Explorer</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            How Tender Track 360 Keeps Your Tenders & POs in Order
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            Explore the day-to-day tools contractors use to attend briefings,
            hit closing deadlines, follow up on expired validities, project
            cashflow, and generate boardroom reports.
          </p>
        </div>

        {/* Tab Controls */}
        <div
          role="tablist"
          aria-label="Product Workflow Modules"
          className="flex flex-wrap items-center justify-center gap-2.5 mb-10 max-w-5xl mx-auto"
        >
          {[
            {
              id: "briefings" as const,
              label: "Briefing & Closing Reminders",
              icon: CalendarClock,
            },
            {
              id: "validity" as const,
              label: "Validity Expiry & Follow-up",
              icon: Hourglass,
            },
            {
              id: "pos" as const,
              label: "Awarded Project POs",
              icon: PackageCheck,
            },
            {
              id: "projections" as const,
              label: "Cash Flow Projections",
              icon: TrendingUp,
            },
            {
              id: "reports" as const,
              label: "Presentation PDF & Excel Reports",
              icon: FileSpreadsheet,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`showcase-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`showcase-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-card/80 text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Showcase Canvas */}
        <div
          id={`showcase-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`showcase-tab-${activeTab}`}
          className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/50 text-left"
        >
          {/* TAB 1: BRIEFING & CLOSING DATES */}
          {activeTab === "briefings" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Briefing Sessions & 11:00 AM Closing Siren Monitor
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Automatic alerts ensure your estimators and bid managers are
                    always on time
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
                  2 Briefings &bull; 3 Closing This Week
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      Tender #ESK-2026-892
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
                      Briefing in 2 Days
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Eskom Transmission Kendal Substation
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Compulsory site briefing at Kendal Substation, Mpumalanga on
                    18 Aug at 10:00 AM.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-400">
                      Tender #SAN-2026-094
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/60">
                      Closing Cutoff: 47h Left
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    SANRAL N2 Road Rehabilitation
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Closes Friday at 11:00 AM sharp. Pre-flight returnable
                    checklist is 100% complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VALIDITY EXPIRY */}
          {activeTab === "validity" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Tender Validity Expiration & Follow-up Trigger
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Never let submitted tenders go unmonitored when government
                    award periods expire
                  </p>
                </div>
                <span className="text-xs font-bold text-sky-300 bg-sky-950/80 px-3 py-1 rounded-lg border border-sky-700/60">
                  1 Tender Overdue For Follow-up
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hourglass
                      className="h-4 w-4 text-amber-400"
                      aria-hidden="true"
                    />
                    <strong className="text-sm text-foreground">
                      Tender #JHB-2026-550 (City of Joburg Bulk Water)
                    </strong>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    90-Day Validity (Day 76 of 90)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted on 30 May 2026. The 90-day bid validity period
                  expires in 14 days. No communication or award notice has been
                  published.
                </p>
                <div className="p-3 rounded-xl bg-card/80 border border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Action: System prompted SCM follow-up inquiry letter
                    template.
                  </span>
                  <span className="text-emerald-400 font-semibold font-mono">
                    Follow-up Queued &check;
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AWARDED POS */}
          {activeTab === "pos" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Post-Award Project & Purchase Order Ledger
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage line items, delivery receipts, and supplier orders on
                    all won projects
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800">
                  R 18.45M Active POs
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    po: "PO #45009823",
                    title: "Transformer Bushings & Insulators",
                    project: "Eskom Substation Overhaul",
                    val: "R 3,450,000",
                    status: "Delivered (Invoiced)",
                  },
                  {
                    po: "PO #45009824",
                    title: "SF6 Switchgear Refurbishment",
                    project: "Eskom Substation Overhaul",
                    val: "R 4,800,000",
                    status: "In Transit",
                  },
                  {
                    po: "PO #77810022",
                    title: "1200mm Ductile Iron Valves",
                    project: "Rand Water Bulk Upgrade",
                    val: "R 6,200,000",
                    status: "Milestone 2 Pending",
                  },
                ].map((item) => (
                  <div
                    key={item.po}
                    className="p-3.5 rounded-xl bg-muted/10 border border-border/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{item.po}</span>
                        <span className="text-muted-foreground font-normal">
                          &bull; {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {item.project}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-foreground">
                        {item.val}
                      </div>
                      <div className="text-[10px] text-amber-400 font-medium">
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CASH FLOW PROJECTIONS */}
          {activeTab === "projections" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Cash Flow & Revenue Projections
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Accurately forecast monthly cash inflows based on active PO
                    milestones
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800">
                  90-Day Projected: R 11,250,000
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/70">
                  <div className="text-xs text-muted-foreground">
                    August 2026 Inflow
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">
                    R 4,250,000
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">
                    Confirmed Delivery POs
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/70">
                  <div className="text-xs text-muted-foreground">
                    September 2026 Inflow
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">
                    R 3,800,000
                  </div>
                  <div className="text-[11px] text-amber-400 mt-1">
                    Testing & Commissioning
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/70">
                  <div className="text-xs text-muted-foreground">
                    October 2026 Inflow
                  </div>
                  <div className="text-xl font-bold font-mono text-foreground mt-1">
                    R 3,200,000
                  </div>
                  <div className="text-[11px] text-sky-300 mt-1">
                    Retention & Final Sign-off
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRESENTATION-READY REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileSpreadsheet
                      className="h-5 w-5 text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>Presentation-Ready Boardroom & Director Reports</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    1-Click download in formatted Excel (.xlsx) and executive
                    PDF for management meetings
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs font-semibold cursor-pointer"
                  >
                    <FileDown
                      className="h-3.5 w-3.5 text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>Download Excel (.xlsx)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs font-semibold cursor-pointer"
                  >
                    <FileText
                      className="h-3.5 w-3.5 text-rose-400"
                      aria-hidden="true"
                    />
                    <span>Download PDF Report</span>
                  </Button>
                </div>
              </div>

              {/* Sample Presentation Document Layout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/10 border border-border/70 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      TT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Executive Tender & PO Pipeline Summary
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Prepared for Board of Directors &bull; Period: Q3 2026
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Ready for Presentation &check;
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      Total Pipeline:
                    </span>
                    <div className="font-bold text-foreground font-mono mt-0.5">
                      R 68,400,000
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      Tenders Won (YTD):
                    </span>
                    <div className="font-bold text-emerald-400 font-mono mt-0.5">
                      78% Win-Rate
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      Active PO Ledger:
                    </span>
                    <div className="font-bold text-amber-400 font-mono mt-0.5">
                      R 18,450,000
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      Audit Compliance:
                    </span>
                    <div className="font-bold text-blue-300 font-mono mt-0.5">
                      100% Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Prompt */}
          <div className="mt-8 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              Ready to take control of your tender deadlines, purchase orders,
              and boardroom reports?
            </span>
            <Button
              size="sm"
              asChild
              className="h-9 px-5 font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <Link href="/sign-up">
                <span>Start For Free</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
