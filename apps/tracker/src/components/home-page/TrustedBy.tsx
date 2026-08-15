import React from 'react';

export function TrustedBy() {
  const brands = [
    {
      name: 'Eskom',
      sub: 'SOC Ltd',
      accent: 'from-blue-600 to-sky-400',
      border: 'border-blue-500/30',
      bg: 'bg-blue-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-blue-400" aria-hidden="true">
          <path d="M12 2L2 19.5h20L12 2zm0 4.5l6.5 11h-13L12 6.5zm-1 3.5v4h2v-4h-2zm0 5v2h2v-2h-2z" />
        </svg>
      ),
    },
    {
      name: 'Transnet',
      sub: 'Freight & Port',
      accent: 'from-emerald-600 to-teal-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-emerald-400" aria-hidden="true">
          <path d="M4 6h16v2H4zm2 5h12v2H6zm3 5h6v2H9z" />
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      name: 'SANRAL',
      sub: 'National Roads',
      accent: 'from-amber-600 to-orange-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-amber-400" aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 3h2v7.5l4.5 2.5-1 1.7-5.5-3.2V5z" />
        </svg>
      ),
    },
    {
      name: 'PRASA',
      sub: 'Rail Agency',
      accent: 'from-cyan-600 to-blue-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-cyan-400" aria-hidden="true">
          <path d="M12 2c-4 0-8 .5-8 4v10c0 2 2 3.5 4 3.5L10 22h4l-2-2.5c2 0 4-1.5 4-3.5V6c0-3.5-4-4-8-4zm-4 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm1-5H7V7h10v3z" />
        </svg>
      ),
    },
    {
      name: 'SARS',
      sub: 'Tax Compliance Pin',
      accent: 'from-emerald-500 to-green-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-emerald-400" aria-hidden="true">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
        </svg>
      ),
    },
    {
      name: 'Treasury CSD',
      sub: 'Verified Supplier',
      accent: 'from-yellow-600 to-amber-400',
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-amber-400" aria-hidden="true">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
        </svg>
      ),
    },
    {
      name: 'CIDB',
      sub: 'Grading 1–9',
      accent: 'from-rose-600 to-red-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-rose-400" aria-hidden="true">
          <path d="M12 3L2 12h3v8h14v-8h3L12 3zm1 15h-2v-4h2v4zm0-6h-2V9h2v3z" />
        </svg>
      ),
    },
    {
      name: 'Municipalities',
      sub: 'All SA Metros',
      accent: 'from-purple-600 to-indigo-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-indigo-400" aria-hidden="true">
          <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-10 border-y border-border/50 bg-secondary/15 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
        {/* Top Centered Title */}
        <div className="space-y-1">
          <p className="text-[11px] uppercase font-mono font-bold tracking-widest text-muted-foreground">
            ENGINEERED FOR SOUTH AFRICAN PROCUREMENT STANDARDS & SOE FRAMEWORKS
          </p>
        </div>

        {/* Brand Logos & Compliance Badges Below */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-stretch pt-2">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className={`p-3 rounded-2xl border ${brand.border} ${brand.bg} backdrop-blur-md flex flex-col items-center justify-center text-center space-y-1.5 transition-all duration-200 hover:scale-105 hover:border-primary/50 group shadow-xs`}
            >
              <div className="p-2 rounded-xl bg-background/50 border border-white/5 group-hover:bg-background transition-colors">
                {brand.icon}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground tracking-tight">
                  {brand.name}
                </div>
                <div className="text-[9px] text-muted-foreground font-mono line-clamp-1">
                  {brand.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
