"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AuthAwareNav from "./AuthAwareNav";
import { Menu, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DOCS_URL } from "@/lib/constants";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg font-medium text-sm"
      >
        Skip to main content
      </a>

      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border/80 shadow-md shadow-black/20"
            : "bg-background/40 backdrop-blur-md border-b border-white/5",
        ].join(" ")}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo with Beta Tag */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/"
              className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
            >
              <div className="hidden md:block">
                <Image
                  src="/logo.svg"
                  alt="Tender Track 360"
                  width={145}
                  height={28}
                  className="h-7 w-auto"
                  priority
                />
              </div>
              <div className="md:hidden">
                <Image
                  src="/logo-icon.svg"
                  alt="Tender Track 360"
                  width={28}
                  height={28}
                  className="h-7 w-auto"
                  priority
                />
              </div>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                aria-hidden="true"
              />
              <span>Public Beta</span>
            </span>
          </div>

          {/* Desktop 3 Nav Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground"
          >
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

          {/* Desktop Auth CTA & Mobile Drawer Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <AuthAwareNav />
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open Navigation Menu"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] p-6 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <SheetHeader className="p-0 text-left">
                      <SheetTitle className="flex items-center gap-2">
                        <Image
                          src="/logo-icon.svg"
                          alt="Tender Track 360"
                          width={24}
                          height={24}
                          className="h-6 w-auto"
                        />
                        <span className="text-base font-bold">
                          Tender Track 360
                        </span>
                      </SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="#how-it-works"
                        onClick={() => setMobileOpen(false)}
                        className="text-base font-medium py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        How It Works
                      </Link>
                      <Link
                        href="#pricing"
                        onClick={() => setMobileOpen(false)}
                        className="text-base font-medium py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Pricing
                      </Link>
                      <Link
                        href="#faq"
                        onClick={() => setMobileOpen(false)}
                        className="text-base font-medium py-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        FAQ
                      </Link>
                      <Link
                        href={DOCS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="text-base font-medium py-2 text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Documentation</span>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/60 flex flex-col gap-3">
                    <Button
                      variant="outline"
                      asChild
                      className="w-full justify-center"
                    >
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full justify-center bg-primary text-primary-foreground font-bold"
                    >
                      <Link
                        href="/sign-up"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        <span>Start For Free</span>
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
