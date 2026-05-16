import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the Tender Track 360 Privacy Policy. Learn how we handle your data in compliance with POPIA.',
};

export default function PrivacyPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-linear-to-b from-secondary/40 via-background to-background p-6 md:p-10">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl opacity-70" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-white/10 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">
              Last updated: December 16, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                1. Introduction & POPIA Compliance
              </h2>
              <p>
                At Tender Track 360, we respect your privacy and are committed
                to protecting your personal data in accordance with the{' '}
                <strong>Protection of Personal Information Act (POPIA)</strong>{' '}
                of South Africa. This privacy policy will inform you as to how
                we look after your personal data when you visit our website and
                tell you about your privacy rights.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                2. The Data We Collect
              </h2>
              <p>
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together as
                follows:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Identity Data</strong> includes first name, last name,
                  username, title, and company registration details.
                </li>
                <li>
                  <strong>Contact Data</strong> includes billing address,
                  physical address, email address and telephone numbers.
                </li>
                <li>
                  <strong>Technical Data</strong> includes IP address, login
                  data, browser type and version, time zone setting and
                  location.
                </li>
                <li>
                  <strong>Usage Data</strong> includes information about how you
                  use our website, products and services.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                3. How We Use Your Data
              </h2>
              <p>
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  Where we need to perform the contract we are about to enter
                  into or have entered into with you.
                </li>
                <li>
                  Where it is necessary for our legitimate interests (or those
                  of a third party) and your corporate interests do not override
                  those interests.
                </li>
                <li>
                  Where we need to comply with a legal or regulatory obligation.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                4. Information Officer
              </h2>
              <p>
                We have appointed an Information Officer who is responsible for
                overseeing questions in relation to this privacy policy. If you
                have any questions about this privacy policy, including any
                requests to exercise your legal rights, please contact the
                Information Officer using the details below:
              </p>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <p>
                  <strong>Information Officer:</strong> Information Officer
                </p>
                <p>
                  <strong>Email:</strong> info@tendertrack360.co.za
                </p>
                <p>
                  <strong>Physical Address:</strong> www.tendertrack360.co.za
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                5. Your Legal Rights (POPIA)
              </h2>
              <p>
                Under POPIA, you have rights in relation to your personal data,
                including the right to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Request access to your personal data.</li>
                <li>Request correction of your personal data.</li>
                <li>
                  Request erasure of your personal data (&quot;Right to be
                  Forgotten&quot;).
                </li>
                <li>Object to the processing of your personal data.</li>
                <li>Request restriction of processing your personal data.</li>
                <li>
                  Lodge a complaint with the Information Regulator of South
                  Africa (https://inforegulator.org.za/).
                </li>
              </ul>
            </section>

            <section className="pt-4 border-t border-white/10">
              <p className="text-sm">
                If you have any questions about this Privacy Policy, please
                contact us at{' '}
                <a
                  href="mailto:info@tendertrack360.co.za"
                  className="text-primary hover:underline"
                >
                  info@tendertrack360.co.za
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
