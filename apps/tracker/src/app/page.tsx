import type { Metadata } from 'next';
import {
  Header,
  HeroSection,
  TrustedBy,
  WorkflowEngineSection,
  PricingSection,
  FaqSection,
  ClosingCtaSection,
  FooterSection,
} from '@/components/home-page';

export const metadata: Metadata = {
  title: 'Tender Management & Purchase Order Software South Africa | Tender Track 360',
  description:
    'Never miss a tender deadline. Track briefing dates, 11:00 AM closing sirens, 90-day validity expiries, and manage awarded project Purchase Orders with Tender Track 360.',
  keywords: [
    'tender management software south africa',
    'eskom tender tracking',
    'transnet tender document prep',
    'purchase order tracking software sa',
    'csd verified tender register',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Tender Track 360',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web-based',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ZAR',
  },
  description:
    'All-in-one tender management, validity tracking, and purchase order system engineered for South African contractors and enterprises.',
  url: 'https://tendertrack360.co.za',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Chapter 1: Razor-Sharp Hero with Live Operations Preview */}
        <HeroSection />

        {/* Institutional Trust Strip */}
        <TrustedBy />

        {/* Chapter 2: The 3-Step Tender & PO Engine */}
        <WorkflowEngineSection />

        {/* Chapter 3: Simple 2-Column Pricing (Free Forever vs Pro Beta Access) */}
        <PricingSection />

        {/* Chapter 4: 4 Essential FAQs & High-Converting Closer */}
        <FaqSection />
        <ClosingCtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
