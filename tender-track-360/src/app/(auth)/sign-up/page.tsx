import { SignUpForm } from '@/components/forms';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account - Start Your Free Trial',
};

export default function SignUp() {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-linear-to-b from-secondary/40 via-background to-background p-6 md:p-10">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl opacity-70" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>
      <div className="w-full max-w-sm md:max-w-md z-10">
        <SignUpForm />
      </div>
    </div>
  );
}
