import { WaitlistForm } from './form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description:
    'Be the first to experience Tender Track 360. Join our exclusive waitlist for early access.',
};

export default function Page() {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b from-secondary/40 via-background to-background p-6 md:p-10">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl opacity-70" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <WaitlistForm />
    </div>
  );
}
