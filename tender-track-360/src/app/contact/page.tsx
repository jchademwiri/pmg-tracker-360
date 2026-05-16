import { ContactForm } from './form';
import type { Metadata } from 'next';
import {
  Mail,
  Phone,
  Clock,
  Linkedin,
  Github,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { CONTACT_INFO } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Tender Track 360 team for support, sales inquiries, or assistance with our tender management platform.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Us | Tender Track 360',
  description: 'Get in touch with the Tender Track 360 team.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Tender Track 360',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: CONTACT_INFO.phone,
        contactType: 'customer service',
        areaServed: 'ZA',
        availableLanguage: 'English',
      },
      {
        '@type': 'ContactPoint',
        email: CONTACT_INFO.email,
        contactType: 'customer service',
      },
    ],
  },
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-[1000px] bg-primary/20 blur-[100px] opacity-20" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-secondary/20 blur-[100px] opacity-20" />
      </div>

      <div className="container mx-auto px-4 py-24">
        {/* Header Section */}
        <div className="max-w-2xl mx-auto text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Get in touch
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Have questions about our tender management solutions? We're here to
            help you streamline your workflow and win more business.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-start max-w-6xl mx-auto">
          {/* Left Column: Info */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Us</h3>
                <a
                  href="mailto:info@tendertrack360.co.za"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@tendertrack360.co.za
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Call Us</h3>
                <a
                  href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {CONTACT_INFO.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">WhatsApp</h3>
                <a
                  href={`https://wa.me/${CONTACT_INFO.whatsapp
                    .replace(/\s/g, '')
                    .replace('+', '')}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 8:00 AM - 5:00 PM (SAST)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-3">Connect with Us</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://x.com/tendertrack360"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-background rounded flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground border border-border"
                    aria-label="Follow us on X"
                  >
                    <FaXTwitter className="h-4 w-4" />
                  </a>
                  <a
                    href="https://linkedin.com/company/tendertrack360"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-background rounded flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground border border-border"
                    aria-label="Follow us on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="https://github.com/tendertrack360"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-background rounded flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground border border-border"
                    aria-label="View our GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-8 shadow-2xl">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
