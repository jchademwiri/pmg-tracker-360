import type { Metadata } from 'next';
import { Header } from '@/components/home-page/Header';
import { FooterSection } from '@/components/home-page/FooterSection';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { ShieldCheck, Target, Award, Rocket, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Tender Track 360',
  description:
    'Discover the story behind Tender Track 360, South Africa’s leading tender management system. Learn how we empower local businesses to track, bid, and win.',
};

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Precision Targeting',
      description:
        'Eliminate noise. We map opportunity signals so South African enterprises focus their bidding energy exactly where their margins are highest.',
    },
    {
      icon: ShieldCheck,
      title: 'Uncompromised Compliance',
      description:
        'With integrated checks for B-BBEE levels, tax clearances, and CSD documentation, we ensure your bidding credentials are always audit-ready.',
    },
    {
      icon: Award,
      title: 'Operational Excellence',
      description:
        'Transition seamlessly. Win the tender, and watch the platform auto-create the project board instantly, maintaining full continuity from bid to delivery.',
    },
    {
      icon: Rocket,
      title: 'Velocity & Scale',
      description:
        'From quick quote deadlines to multi-million Rand public sector bids, our automated deadline notifications accelerate your operational response time.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <Header />

      <main className="relative isolate pt-24">
        {/* Background gradient shapes */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-primary/30 to-secondary/30 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72rem]" />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-28 text-center space-y-6 max-w-4xl">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Our Mission
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Pioneering Tender Excellence for South African Enterprises
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Tender Track 360 is built to eliminate the complexity of public and
            private sector procurement, empowering local businesses to track deadlines,
            manage critical compliance, and scale operations seamlessly.
          </p>
        </section>

        {/* Core Pillars */}
        <section className="border-t border-border/40 bg-muted/20 py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                What Guides Us
              </h2>
              <p className="text-muted-foreground">
                We believe that unlocking business potential starts with transparent
                procurement workflows and automated intelligence.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
              {values.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <div
                    key={idx}
                    className="flex gap-4 p-6 rounded-2xl border bg-card/50 backdrop-blur-xs shadow-xs hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0 h-fit">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{val.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {val.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Narrative / Story */}
        <section className="container mx-auto px-4 py-24 max-w-4xl space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">The Story Behind the System</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tender Track 360 was founded with a single, clear purpose: to bridge the gap
              between secure procurement and backend operations. In the South African market,
              businesses often spend hundreds of hours preparing bids, only to lose them due
              to missed deadlines or expired compliance files. 
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We set out to change that by designing a platform that serves as a single source
              of truth. Today, Tender Track 360 not only handles active opportunity tracking,
              document management, and notifications, but automatically establishes full project
              boards and purchase order pipelines the second a bid is won.
            </p>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-primary to-secondary p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xl">
            <div className="space-y-3 max-w-md">
              <h3 className="text-2xl font-bold">Ready to secure your pipeline?</h3>
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                Join our exclusive waitlist for early access features or get in touch
                with our SA sales team today.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="secondary" size="lg">
                <Link href="/waitlist">
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
