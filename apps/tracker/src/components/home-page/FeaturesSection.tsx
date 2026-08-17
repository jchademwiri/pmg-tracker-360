import Link from "next/link";
import {
  Clock,
  CalendarCheck,
  Hourglass,
  PackageCheck,
  TrendingUp,
  FolderCheck,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturesSection() {
  const corePillars = [
    {
      icon: Clock,
      title: "Briefing & Closing Date Reminders",
      description:
        "Never scramble or miss a deadline. Receive automated alerts before mandatory briefing sessions and 11:00 AM closing cutoffs so your submissions are always on time.",
      points: [
        "Mandatory site briefing alarms & calendar sync",
        "Automated 72h / 24h closing countdowns",
        "Zero missed tender submissions",
      ],
    },
    {
      icon: Hourglass,
      title: "Tender Validity Expiry & Follow-up Tracker",
      description:
        "Submitted a bid and heard nothing? Track 90-day and 120-day validity periods and get alerted when validity is expiring so you can follow up with the buyer proactively.",
      points: [
        "Automatic validity period expiration counter",
        "Follow-up reminders when evaluation is delayed",
        "Formal inquiry log & SCM communication tracking",
      ],
    },
    {
      icon: FolderCheck,
      title: "Keep Every Tender Organized & Audit-Ready",
      description:
        "Centralize all your tender documents, addenda, returnables, and certificates in one structured workspace. Stay prepared and organized at any given second.",
      points: [
        "Single source of truth for all active bids",
        "Addendum tracking & version management",
        "Pre-flight returnable checklists",
      ],
    },
    {
      icon: PackageCheck,
      title: "Awarded Project & PO Management",
      description:
        "Once you win, manage your active projects, supplier Purchase Orders, itemized deliverables, and milestone fulfillment without messy spreadsheets.",
      points: [
        "1-Click conversion from awarded bid to project",
        "Line-item Purchase Order tracking",
        "Delivery receipts & invoice milestone tracking",
      ],
    },
    {
      icon: TrendingUp,
      title: "Cash Flow & Revenue Projections",
      description:
        "Perform accurate cash flow forecasting based on your won projects and active PO balances. Know your exact projected income over 30, 60, and 90 days.",
      points: [
        "Cashflow forecasting from active PO balances",
        "Realized vs. pending revenue breakdown",
        "Pipeline valuation & margin insights",
      ],
    },
    {
      icon: FileSpreadsheet,
      title: "Presentation-Ready PDF & Excel Reports",
      description:
        "Generate executive-ready reports with one click. Download beautifully formatted Excel workbooks (.xlsx) or polished PDF summaries ready for boardroom and director presentations.",
      points: [
        "Formatted Excel (.xlsx) & CSV registers",
        "Executive PDF reports with win-rate analytics",
        "Presentation-ready for directors and investors",
      ],
    },
  ];

  return (
    <section
      id="features"
      className="py-24 border-t border-border/40 bg-secondary/10 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Why Contractors Choose Tender Track 360</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            The Key Advantages That Keep Your Tenders & POs in Order
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            Everything designed around the real workflow of winning tenders,
            tracking validities, fulfilling purchase orders, and presenting
            reports.
          </p>
        </div>

        {/* Core Pillars Grid (6 cards in a 3x2 grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {corePillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-6 sm:p-7 rounded-3xl border border-border/70 bg-card/60 backdrop-blur-md hover:border-primary/50 hover:bg-card/90 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-6 text-left"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <pillar.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-2">
                {pillar.points.map((pt) => (
                  <div
                    key={pt}
                    className="flex items-center gap-2 text-xs text-foreground/90 font-medium"
                  >
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-14 text-center">
          <Button
            size="lg"
            asChild
            className="h-12 px-8 font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg cursor-pointer"
          >
            <Link href="/sign-up">
              <span>Start For Free & Organize Your Bids</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
