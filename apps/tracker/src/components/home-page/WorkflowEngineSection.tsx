import Link from "next/link";
import {
  CalendarClock,
  Hourglass,
  PackageCheck,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function WorkflowEngineSection() {
  const steps = [
    {
      step: "01",
      icon: CalendarClock,
      tag: "PRE-SUBMISSION",
      title: "Track Briefings & Submit on Time",
      description:
        "Never miss a mandatory briefing session or get disqualified by a strict 11:00 AM closing cutoff. Automated alarms notify your estimators days in advance while returnable checklists ensure 100% compliance.",
      features: [
        "Mandatory site inspection alerts & calendar sync",
        "72h, 24h, and 4h closing countdown sirens",
        "Pre-flight SBD 4, CSD & SARS Pin verification",
      ],
    },
    {
      step: "02",
      icon: Hourglass,
      tag: "EVALUATION MONITORING",
      title: "Track Validity Expiries & Follow Up",
      description:
        "Submitted your bid and heard nothing back? Automatically monitor 90-day and 120-day bid validity periods and receive reminders to follow up with the procurement office before decisions expire.",
      features: [
        "Automatic 90/120-day validity countdown tracker",
        "Proactive follow-up prompts when evaluation stalls",
        "Audit-ready submission logs & correspondence history",
      ],
    },
    {
      step: "03",
      icon: PackageCheck,
      tag: "POST-AWARD & REPORTING",
      title: "Manage Awarded POs & Present to the Board",
      description:
        "1-Click conversion from won tender to active project. Track supplier and client Purchase Orders, forecast upcoming monthly cashflow, and download presentation-ready PDF and Excel reports with a single click.",
      features: [
        "1-Click conversion into active project & PO ledger",
        "30, 60, and 90-day cashflow forecasting",
        "Boardroom-ready PDF & formatted Excel (.xlsx) reports",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-24 border-t border-border/40 bg-secondary/10 scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>The 3-Step Tender & PO Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
            Everything in Order, From Briefing to PO Delivery
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty">
            Three simple steps that give your business complete command over the
            entire bidding and contract fulfillment lifecycle.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {steps.map((item) => (
            <div
              key={item.step}
              className="p-6 sm:p-7 rounded-3xl border border-border/70 bg-card/75 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-6 hover:border-primary/50 hover:bg-card/95 transition-all text-left group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-2xl font-extrabold text-muted-foreground/30">
                    {item.step}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    {item.tag}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-1">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bullet Features */}
              <div className="pt-4 border-t border-border/50 space-y-2">
                {item.features.map((feat) => (
                  <div
                    key={feat}
                    className="flex items-start gap-2 text-xs text-foreground/90 font-medium"
                  >
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Hook */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            asChild
            className="h-11 px-8 font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
          >
            <Link href="/sign-up">
              <span>Start For Free & Organize Your Tenders</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
