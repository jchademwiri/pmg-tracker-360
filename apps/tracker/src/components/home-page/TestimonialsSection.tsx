import { Star, ShieldCheck, Quote, Building } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      id: '1',
      name: 'Sipho Ndlovu',
      role: 'Managing Director',
      company: 'Isipho Electrical & Civils (Gauteng)',
      content:
        'Tender Track 360 literally saved us from a R42M Eskom tender disqualification. The pre-flight checklist caught an outdated BBBEE affidavit 2 hours before the 11:00 AM cutoff. We won the bid.',
      stat: 'R 42M Contract Won',
      rating: 5,
    },
    {
      id: '2',
      name: 'Anri van der Merwe',
      role: 'Head of Bidding & Estimating',
      company: 'Apex Infrastructure Group (Western Cape)',
      content:
        'We bid for over 30 municipal and SANRAL tenders per year. Managing everything in Tender Track 360 reduced our preparation time by 60%. The countdown alarms ensure our team never scrambles.',
      stat: '60% Faster Submissions',
      rating: 5,
    },
    {
      id: '3',
      name: 'Kagiso Motsepe',
      role: 'Operations & Procurement Lead',
      company: 'Vuka Engineering Services (KwaZulu-Natal)',
      content:
        'The best part is post-award: winning a tender automatically converts into active projects and itemized Purchase Orders. It replaced three separate spreadsheets and eliminated billing discrepancies.',
      stat: '1-Click PO Conversion',
      rating: 5,
    },
  ];

  return (
    <section className="py-24 border-t border-border/40 bg-secondary/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
            <span>Proven In The Field</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Trusted by South Africa's Most Competitive Bid Teams
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            Discover how leading engineering, construction, and supply contractors win government and private bids with Tender Track 360.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="p-6 sm:p-8 rounded-3xl border border-border/70 bg-card/70 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-6 text-left hover:border-primary/40 transition-all"
            >
              <div className="space-y-4">
                {/* Stars & Stat Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    {item.stat}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                  "{item.content}"
                </p>
              </div>

              {/* Submitter Bio */}
              <div className="pt-4 border-t border-border/50 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary font-extrabold text-xs flex items-center justify-center border border-primary/30 shrink-0">
                  {item.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground">{item.role}</div>
                  <div className="text-[10px] text-primary/90 font-medium">{item.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
