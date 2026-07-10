import type { Metadata } from 'next';
import { Header } from '@/components/home-page/Header';
import { HeroSection } from '@/components/home-page/HeroSection';
import { FeaturesSection } from '@/components/home-page/FeaturesSection';
import { BenefitsSection } from '@/components/home-page/BenefitsSection';
import { PricingSection } from '@/components/home-page/PricingSection';
import { TestimonialsSection } from '@/components/home-page/TestimonialsSection';
import { FooterSection } from '@/components/home-page/FooterSection';
// import { TrustedBy } from '@/components/home-page/TrustedBy';

export const metadata: Metadata = {
  title: 'Tender Management Software South Africa',
  description:
    'Streamline your tender management process, track deadlines, and win more bids with Tender Track 360. The all-in-one solution for SA businesses.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Tender Track 360',
  url: 'https://tendertrack360.co.za',
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <HeroSection />
        {/* <TrustedBy /> */}
        <FeaturesSection />
        <BenefitsSection />
        <PricingSection />
        <TestimonialsSection />
        <FooterSection />
      </main>
    </div>
  );
}
