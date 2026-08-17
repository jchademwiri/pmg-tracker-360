import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/providers";
import { Analytics } from "@vercel/analytics/next";
import { BetaLabel } from "@/components/shared/beta-label";
import { HelpWidget } from "@/components/shared/help-widget";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tendertrack360.co.za"),
  title: {
    template: "%s | Tender Track 360",
    default: "Tender Track 360 - Online Tender Management System",
  },
  description:
    "Your Gateway to Online Tender Management System. Streamline tracking, compliance, and bid management.",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://tendertrack360.co.za",
    siteName: "Tender Track 360",
    title: "Tender Track 360 - Online Tender Management & PO Tracking",
    description:
      "Never miss a tender deadline. Track briefing dates, 11:00 AM closing sirens, 90-day validity expiries, and manage awarded project Purchase Orders with Tender Track 360.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tender Track 360 Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tender Track 360 - Online Tender Management & PO Tracking",
    description:
      "Never miss a tender deadline. Track briefing dates, 11:00 AM closing sirens, 90-day validity expiries, and manage awarded project Purchase Orders.",
    images: ["/og-image.png"],
    creator: "@tendertrack360",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tender Track 360",
  url: "https://tendertrack360.co.za",
  logo: "https://tendertrack360.co.za/icon.png",
  sameAs: [
    "https://x.com/jchademwiri",
    "https://linkedin.com/company/playhouse-media-group",
    "https://github.com/jchademwiri/pmg-tracker-360",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-background text-foreground min-h-screen"
        suppressHydrationWarning
      >
        <Script
          id="jsonld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">{children}</div>
          <BetaLabel />
          <HelpWidget />
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
