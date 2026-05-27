'use client';

import { Building2, Globe2, Layers, Zap } from 'lucide-react';

export function TrustedBy() {
  const companies = [
    { name: 'TechCorp', icon: Zap },
    { name: 'Global Inc', icon: Globe2 },
    { name: 'Innovation', icon: Layers },
    { name: 'Solutions', icon: Building2 },
    { name: 'NexGen', icon: Globe2 },
  ];

  return (
    <section className="py-12 bg-background border-y border-border/40">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">
          TRUSTED BY INNOVATIVE TEAMS AT
        </p>

        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {companies.map((company) => (
            <div
              key={company.name}
              className="flex items-center gap-2 group cursor-default"
            >
              <company.icon className="h-6 w-6 text-foreground/80 group-hover:text-primary transition-colors duration-300" />
              <span className="text-lg font-semibold text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
