import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Database,
  Shield,
  Activity,
} from 'lucide-react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Platform Admin console | Tender Track 360',
  description: 'System-wide platform controls for Tender Track 360.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    // Better Auth Next.js server session loading requires request headers
    headers: await headers(),
  });

  const user = session?.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = user && (user as any).role === 'admin';

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex bg-background text-foreground select-none"
        suppressHydrationWarning
      >
        {isAdmin ? (
          <div className="flex flex-1 min-h-screen font-sans">
            {/* 1. BRANDED PLATFORM SIDEBAR */}
            <aside className="w-64 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)] flex flex-col">
              {/* Sidebar Header */}
              <div className="h-16 px-6 border-b border-[var(--sidebar-border)] flex items-center gap-3 bg-[oklch(0.16_0.02_255)]">
                <Shield className="h-6 w-6 text-[var(--sidebar-primary)] animate-pulse" />
                <span className="font-bold text-lg tracking-wider text-white">
                  PLATFORM <span className="text-[var(--sidebar-primary)]">ADMIN</span>
                </span>
              </div>

              {/* Sidebar Nav Items */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.25_0.02_255)] hover:text-white transition-all group"
                >
                  <LayoutDashboard className="h-4 w-4 text-[var(--sidebar-primary)] group-hover:scale-110 transition-transform" />
                  Dashboard Overview
                </Link>
                <Link
                  href="/users"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.25_0.02_255)] hover:text-white transition-all group"
                >
                  <Users className="h-4 w-4 text-[var(--sidebar-primary)] group-hover:scale-110 transition-transform" />
                  Manage Users
                </Link>
                <Link
                  href="/organizations"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[oklch(0.25_0.02_255)] hover:text-white transition-all group"
                >
                  <Building2 className="h-4 w-4 text-[var(--sidebar-primary)] group-hover:scale-110 transition-transform" />
                  Manage Orgs
                </Link>
              </nav>

              {/* Sidebar Profile Card */}
              <div className="p-4 border-t border-[var(--sidebar-border)] bg-[oklch(0.16_0.02_255)]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] flex items-center justify-center font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* 2. MAIN APPLICATION CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
              {/* Header Bar */}
              <header className="h-16 px-8 border-b border-border/60 flex items-center justify-between bg-card/40 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  <Database className="h-4 w-4 text-emerald-500" />
                  Live Cluster Nominal
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span>Beta v1.0</span>
                  </div>
                </div>
              </header>

              {/* Main Panel Body */}
              <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-screen justify-center items-center font-sans bg-zinc-950">
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
