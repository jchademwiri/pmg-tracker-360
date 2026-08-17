import {
  Clock,
  Users,
  TrendingUp,
  LifeBuoy,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function CoreHighlightsSection() {
  const highlights = [
    {
      icon: Clock,
      color:
        "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
      title: "Automated 11:00 AM Closing Siren",
      description:
        "Never lose a tender to closing hour confusion. Real-time countdown sirens and status beacons notify your team days before cutoff.",
      bullets: [
        "Urgent closing beacons",
        "Automated email alerts",
        "Calendar synchronization",
      ],
    },
    {
      icon: Users,
      color:
        "from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30",
      title: "Multi-Tenant Team Collaboration",
      description:
        "Invite estimators, project managers, and directors with role-based permissions (Admin, Manager, Member) and audit logs.",
      bullets: [
        "Role-based access control",
        "Multi-organization support",
        "Activity audit trails",
      ],
    },
    {
      icon: TrendingUp,
      color:
        "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
      title: "Win-Rate & Margin Analytics",
      description:
        "Analyze tender performance, win-loss ratios, client margins, and pipeline valuations with executive visual reports.",
      bullets: [
        "Pipeline valuation metrics",
        "Win-loss ratio tracking",
        "Executive CSV & PDF reports",
      ],
    },
    {
      icon: LifeBuoy,
      color:
        "from-amber-400/20 to-yellow-500/10 text-primary border-primary/30",
      title: "In-App Concierge Support Desk",
      description:
        "Direct two-way support chat with systematic ticket reference codes (#TICK-1005) and instant transcript preservation.",
      bullets: [
        "Real-time live desk triage",
        "Transcript email delivery",
        "Priority assistance",
      ],
    },
  ];

  return (
    <section className="py-16 md:py-20 border-b border-border/50 bg-secondary/15 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-3xl border border-border/70 bg-card/75 backdrop-blur-xl hover:border-primary/50 hover:bg-card/95 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6 group text-left"
            >
              <div className="space-y-3.5">
                {/* Icon Badge */}
                <div
                  className={`h-12 w-12 rounded-2xl bg-linear-to-br ${item.color} border flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs`}
                >
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bullet points */}
              <div className="pt-4 border-t border-border/50 space-y-2">
                {item.bullets.map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-2 text-xs text-foreground/90 font-medium"
                  >
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
