import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the Tender Track 360 Terms of Service. Understand your rights and responsibilities when using our platform.',
};

export default function TermsPage() {
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
            <CardTitle className="text-3xl font-bold">
              Terms of Service
            </CardTitle>
            <p className="text-muted-foreground">
              Last updated: December 16, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                1. Introduction
              </h2>
              <p>
                Welcome to Tender Track 360. By accessing or using our website
                and services, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree
                with any part of these terms, you may not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                2. Use License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the
                materials (information or software) on Tender Track 360's
                website for personal, non-commercial transitory viewing only.
                This is the grant of a license, not a transfer of title, and
                under this license, you may not:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Modify or copy the materials;</li>
                <li>
                  Use the materials for any commercial purpose, or for any
                  public display (commercial or non-commercial);
                </li>
                <li>
                  Attempt to decompile or reverse engineer any software
                  contained on Tender Track 360's website;
                </li>
                <li>
                  Remove any copyright or other proprietary notations from the
                  materials; or
                </li>
                <li>
                  Transfer the materials to another person or "mirror" the
                  materials on any other server.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                3. Disclaimer
              </h2>
              <p>
                The materials on Tender Track 360's website are provided on an
                'as is' basis. Tender Track 360 makes no warranties, expressed
                or implied, and hereby disclaims and negates all other
                warranties including, without limitation, implied warranties or
                conditions of merchantability, fitness for a particular purpose,
                or non-infringement of intellectual property or other violation
                of rights.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                4. Limitations
              </h2>
              <p>
                In no event shall Tender Track 360 or its suppliers be liable
                for any damages (including, without limitation, damages for loss
                of data or profit, or due to business interruption) arising out
                of the use or inability to use the materials on Tender Track
                360's website, even if Tender Track 360 or a Tender Track 360
                authorized representative has been notified orally or in writing
                of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                5. Accuracy of Materials
              </h2>
              <p>
                The materials appearing on Tender Track 360's website could
                include technical, typographical, or photographic errors. Tender
                Track 360 does not warrant that any of the materials on its
                website are accurate, complete, or current. Tender Track 360 may
                make changes to the materials contained on its website at any
                time without notice. However, Tender Track 360 does not make any
                commitment to update the materials.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                6. Links
              </h2>
              <p>
                Tender Track 360 has not reviewed all of the sites linked to its
                website and is not responsible for the contents of any such
                linked site. The inclusion of any link does not imply
                endorsement by Tender Track 360 of the site. Use of any such
                linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-xl font-semibold mb-2">
                7. Governing Law
              </h2>
              <p>
                These terms and conditions are governed by and construed in
                accordance with the laws of South Africa and you irrevocably
                submit to the exclusive jurisdiction of the courts in that State
                or location.
              </p>
            </section>

            <section className="pt-4 border-t border-white/10">
              <p className="text-sm">
                If you have any questions about these Terms, please contact us
                at{' '}
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
