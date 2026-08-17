import { Twitter, Linkedin, Github, BookOpen, Mail, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CONTACT_INFO, DOCS_URL } from "@/lib/constants";

export function FooterSection() {
  return (
    <footer className="bg-muted/60 border-t border-border/80 py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Social */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Tender Track 360"
                width={140}
                height={28}
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All-in-one tender management, validity tracking, and purchase
              order system engineered for South African contractors and
              enterprises.
            </p>
            <div className="flex space-x-3 pt-1">
              <a
                href="https://twitter.com/tendertrack360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-secondary/80 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/organization/tendertrack360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-secondary/80 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/tendertrack360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-secondary/80 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
                aria-label="View our GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {CONTACT_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={`tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`}
                  className="hover:text-foreground transition-colors"
                >
                  {CONTACT_INFO.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 font-mono">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/modules"
                  className="hover:text-foreground transition-colors"
                >
                  Platform Modules
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="hover:text-foreground transition-colors"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  href="/waitlist"
                  className="hover:text-foreground transition-colors"
                >
                  Early Access Waitlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Docs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 font-mono">
              Support & Docs
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link
                  href={DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Support Desk
                </Link>
              </li>
              <li>
                <Link
                  href="/training"
                  className="hover:text-foreground transition-colors"
                >
                  Bidding Training
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Company & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4 font-mono">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  About Tender Track 360
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-foreground transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-foreground transition-colors"
                >
                  Procurement Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy (POPIA)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Tender Track 360. All rights
            reserved. Built in South Africa.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-foreground font-medium">
                All Systems Operational
              </span>
            </div>
            <span className="text-muted-foreground/60">&bull;</span>
            <span>POPIA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
