import type { Metadata } from "next";
import {
  Header,
  HeroSection,
  TrustedBy,
  WorkflowEngineSection,
  InteractiveProductShowcase,
  RoiCalculator,
  TestimonialsSection,
  PricingSection,
  FaqSection,
  ClosingCtaSection,
  FooterSection,
} from "@/components/home-page";
import { HOMEPAGE_FAQS } from "@/data/faqs";
import { getSubscriptionPlans } from "@pmg/db";

export const metadata: Metadata = {
  title:
    "Tender Management & Purchase Order Software South Africa | Tender Track 360",
  description:
    "Never miss a tender deadline. Track briefing dates, 11:00 AM closing sirens, 90-day validity expiries, and manage awarded project Purchase Orders with Tender Track 360.",
  alternates: {
    canonical: "https://tendertrack360.co.za",
  },
  keywords: [
    "tender management software south africa",
    "eskom tender tracking",
    "transnet tender document prep",
    "purchase order tracking software sa",
    "csd verified tender register",
    "cidb tender compliance",
    "tender validity tracker",
  ],
  openGraph: {
    title:
      "Tender Management & Purchase Order Software South Africa | Tender Track 360",
    description:
      "Never miss a tender deadline. Track briefing dates, 11:00 AM closing sirens, 90-day validity expiries, and manage awarded project Purchase Orders with Tender Track 360.",
    url: "https://tendertrack360.co.za",
    siteName: "Tender Track 360",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tender Track 360 Platform Overview",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Tender Management & Purchase Order Software South Africa | Tender Track 360",
    description:
      "Never miss a tender deadline. Track briefing dates, 11:00 AM closing sirens, 90-day validity expiries, and manage awarded project Purchase Orders.",
    images: ["/og-image.png"],
  },
};

const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://tendertrack360.co.za/#website",
      url: "https://tendertrack360.co.za",
      name: "Tender Track 360",
      description:
        "All-in-one tender management, validity tracking, and purchase order system engineered for South African contractors and enterprises.",
      inLanguage: "en-ZA",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://tendertrack360.co.za/#application",
      name: "Tender Track 360",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web-based",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ZAR",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
      },
      description:
        "All-in-one tender management, validity tracking, and purchase order system engineered for South African contractors and enterprises.",
      url: "https://tendertrack360.co.za",
    },
    {
      "@type": "FAQPage",
      "@id": "https://tendertrack360.co.za/#faq",
      mainEntity: HOMEPAGE_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
  ],
};

export default async function Home() {
  const plans = await getSubscriptionPlans();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Chapter 1: Razor-Sharp Hero with Live Operations Preview */}
        <HeroSection />

        {/* Institutional Trust Strip */}
        <TrustedBy />

        {/* Chapter 2: The 3-Step Tender & PO Engine */}
        <WorkflowEngineSection />

        {/* Chapter 3: Interactive Deep-Dive Product Showcase */}
        <InteractiveProductShowcase />

        {/* Chapter 4: Interactive PO & Cashflow Projection Simulator */}
        <RoiCalculator />

        {/* Chapter 5: South African Contractor Social Proof */}
        <TestimonialsSection />

        {/* Chapter 6: Dynamic Database-Driven 3-Tier Pricing */}
        <PricingSection plans={plans} />

        {/* Chapter 7: Essential FAQs & High-Converting Closer */}
        <FaqSection />
        <ClosingCtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
