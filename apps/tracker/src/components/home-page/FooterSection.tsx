import { Twitter, Linkedin, Github, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { CONTACT_INFO, DOCS_URL } from '@/lib/constants';

export function FooterSection() {
  return (
    <footer className="bg-muted border-t py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-foreground">
              Tender Track 360
            </h3>
            <p className="text-muted-foreground mb-4">
              Streamline your tender management process with our comprehensive
              platform.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/tendertrack360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-secondary rounded flex items-center justify-center hover:bg-secondary/80 transition-colors text-secondary-foreground"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/organization/tendertrack360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-secondary rounded flex items-center justify-center hover:bg-secondary/80 transition-colors text-secondary-foreground"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/tendertrack360"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-secondary rounded flex items-center justify-center hover:bg-secondary/80 transition-colors text-secondary-foreground"
                aria-label="View our GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#security"
                  className="hover:text-foreground transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="#integrations"
                  className="hover:text-foreground transition-colors"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
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
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/training"
                  className="hover:text-foreground transition-colors"
                >
                  Training
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  About
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
                  Blog
                </Link>
              </li>
            </ul>
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
