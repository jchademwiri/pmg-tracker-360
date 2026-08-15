import { Twitter, Linkedin, Github, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { DOCS_URL } from '@/lib/constants';

export function FooterSection() {
  return (
    <footer className="border-t border-border/70 bg-card/60 backdrop-blur-xl py-12 text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border/50">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo.svg" alt="Tender Track 360" className="h-7 w-auto" />
            </Link>
            <span className="text-muted-foreground/60 hidden sm:inline">&bull;</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Tender & Purchase Order Management for SA Contractors
            </span>
          </div>

          {/* Quick Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              <span>Docs</span>
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Tender Track 360. All rights reserved. Built in South Africa.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-foreground font-medium">All Systems Operational</span>
            </div>
            <span className="text-muted-foreground/60">&bull;</span>
            <span className="text-muted-foreground">POPIA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
