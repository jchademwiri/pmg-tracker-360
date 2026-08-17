import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb";
import { BreadcrumbProvider } from "@/lib/breadcrumb-context";
import { Database, Activity, Menu } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Platform Admin console | Tender Track 360",
  description: "System-wide platform controls for Tender Track 360.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;
  const isAdmin =
    user && (user as any).role === "admin" && !(user as any).mustSetPassword;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex bg-background text-foreground"
        suppressHydrationWarning
      >
        {isAdmin ? (
          <div className="h-screen flex w-full">
            <BreadcrumbProvider>
              <SidebarProvider>
                <AdminSidebar userName={user?.name} userEmail={user?.email} />
                <SidebarInset className="flex-1 flex flex-col">
                  {/* Header Bar */}
                  <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--sidebar-border)] bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-3 px-4 w-full min-w-0">
                      <SidebarTrigger className="-ml-1 shrink-0">
                        <Menu className="size-4" />
                        <span className="sr-only">Toggle Sidebar</span>
                      </SidebarTrigger>
                      <Separator
                        orientation="vertical"
                        className="mr-1 data-[orientation=vertical]:h-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <AdminBreadcrumb />
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                        <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-zinc-900/60 px-2.5 py-1 rounded-md border border-zinc-800">
                          <Database className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Live Cluster Nominal</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-zinc-900/60 px-2.5 py-1 rounded-md border border-zinc-800">
                          <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                          <span>Beta v1.0</span>
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* Main Panel Body */}
                  <div className="flex-1 flex flex-col gap-4 p-4 pt-0 overflow-y-auto">
                    <main className="flex-1 max-w-7xl w-full mx-auto space-y-8 py-4">
                      {children}
                    </main>
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </BreadcrumbProvider>
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
