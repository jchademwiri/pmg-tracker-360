import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/shared/providers';
import { Analytics } from '@vercel/analytics/next';
import { BetaLabel } from '@/components/shared/beta-label';
import { HelpWidget } from '@/components/shared/help-widget';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tendertrack360.co.za'),
  title: {
    template: '%s | Tender Track 360',
    default: 'Tender Track 360 - Online Tender Management System',
  },
  description:
    'Your Gateway to Online Tender Management System. Streamline tracking, compliance, and bid management.',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://tendertrack360.co.za',
    siteName: 'Tender Track 360',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Tender Track 360',
  url: 'https://tendertrack360.co.za',
  logo: 'https://tendertrack360.co.za/icon.png',
  sameAs: [
    'https://x.com/tendertrack360',
    'https://linkedin.com/company/tendertrack360',
    'https://github.com/tendertrack360',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>{children}</main>
          <BetaLabel />
          <HelpWidget />
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
