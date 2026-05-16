import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-secondary/40 via-background to-background">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl opacity-70" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-sm text-muted-foreground backdrop-blur supports-backdrop-filter:bg-background/40">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            All-in-one tender management
          </div>

          <h1 className="mb-6 max-w-5xl text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            <span className="bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Streamline Your Tender Management Process
            </span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Comprehensive tender management platform that helps organizations
            track, manage, and win more tenders.
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="px-8">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
