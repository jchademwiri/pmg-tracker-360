'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthAwareNav from './AuthAwareNav';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border/80 shadow-md shadow-black/20'
          : 'bg-background/40 backdrop-blur-md border-b border-white/5',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand Logo with Subtle Beta Tag */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <img
              src="/logo.svg"
              alt="Tender Track 360"
              className="hidden md:block h-7 w-auto"
            />
            <img
              src="/logo-icon.svg"
              alt="Tender Track 360"
              className="md:hidden h-7 w-auto"
            />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            <span>Beta &bull; Free</span>
          </span>
        </div>

        {/* Minimalist 3 Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link
            href="#how-it-works"
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-1"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-1"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-1"
          >
            FAQ
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <AuthAwareNav />
        </div>
      </div>
    </header>
  );
}
