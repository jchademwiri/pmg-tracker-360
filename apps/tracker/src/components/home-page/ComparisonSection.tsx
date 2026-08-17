import { Check, X, ShieldCheck, Zap } from "lucide-react";

export function ComparisonSection() {
  const comparisonRows = [
    {
      capability: "Briefing Session Reminders",
      without:
        "Missed mandatory site briefings leading to automatic disqualification",
      withTt:
        "Automated briefing alerts with calendar integration and venue details",
    },
    {
      capability: "Closing Date Alarms",
      without: "Scrambling on closing morning, risking strict 11:00 AM cutoffs",
      withTt:
        "72h, 24h, and 4h countdown alarms with pre-flight returnables check",
    },
    {
      capability: "Tender Validity Expiry Follow-up",
      without:
        "Submitted bids forgotten; no follow-up when 90-day validity lapses",
      withTt: "Automatic validity countdown with prompt to follow up with SCM",
    },
    {
      capability: "Awarded Project & PO Tracking",
      without:
        "Scattered spreadsheets to track PO line items and supplier deliveries",
      withTt:
        "Centralized PO ledger linked directly to the won tender and project",
    },
    {
      capability: "Cash Flow & Income Projections",
      without:
        "Financial guesswork and uncertainty over upcoming payment milestones",
      withTt:
        "Accurate 30/60/90-day cash projections based on active PO balances",
    },
    {
      capability: "Tender Submission Preparedness",
      without: "Panic searching through folders for previous compliance packs",
      withTt:
        "Always organized, audit-ready, and prepared for any tender inquiry",
    },
    {
      capability: "Executive & Presentation Reporting",
      without:
        "Manually copying messy spreadsheets into Word for management meetings",
      withTt:
        "1-Click download of presentation-ready PDF reports & formatted Excel workbooks",
    },
  ];

  return (
    <section className="py-24 border-t border-border/40 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>The Power of Being Organized</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Why Contractors Choose to Manage Tenders & POs with Tender Track 360
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            Compare manual spreadsheet tracking against an automated procurement
            system engineered to keep your bids on schedule and your POs under
            control.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border/70 bg-muted/40 p-4 sm:p-6 text-sm font-bold">
            <div className="md:col-span-4 text-muted-foreground uppercase text-xs tracking-wider">
              CORE WORKFLOW
            </div>
            <div className="md:col-span-4 text-rose-400 flex items-center gap-2 mt-2 md:mt-0">
              <X className="h-4 w-4" aria-hidden="true" />
              <span>WITHOUT TENDER TRACK 360</span>
            </div>
            <div className="md:col-span-4 text-amber-400 flex items-center gap-2 mt-2 md:mt-0 font-extrabold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>WITH TENDER TRACK 360</span>
            </div>
          </div>

          <div className="divide-y divide-border/50">
            {comparisonRows.map((row) => (
              <div
                key={row.capability}
                className="grid grid-cols-1 md:grid-cols-12 p-4 sm:p-6 text-xs sm:text-sm transition-colors hover:bg-muted/20 items-center gap-3 md:gap-0"
              >
                <div className="md:col-span-4 font-bold text-foreground pr-4">
                  {row.capability}
                </div>
                <div className="md:col-span-4 text-muted-foreground flex items-start gap-2 pr-4">
                  <span className="text-rose-400 font-bold shrink-0 mt-0.5">
                    &times;
                  </span>
                  <span>{row.without}</span>
                </div>
                <div className="md:col-span-4 text-foreground flex items-start gap-2 font-medium bg-amber-500/5 md:bg-transparent p-2.5 md:p-0 rounded-xl border border-amber-500/20 md:border-0">
                  <Check
                    className="h-4 w-4 text-emerald-400 font-bold shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{row.withTt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
