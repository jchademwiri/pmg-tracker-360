'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderOpen,
  ShoppingCart,
  Settings,
} from 'lucide-react';
import { NavBar } from '@pmg/ui/components/shared/nav-bar';
import { cn } from '@pmg/ui/lib/utils';
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/dashboard/tenders', label: 'Tenders', icon: <FileText /> },
  { href: '/dashboard/clients', label: 'Clients', icon: <Users /> },
  { href: '/dashboard/projects', label: 'Projects', icon: <FolderOpen /> },
  { href: '/dashboard/purchase-orders', label: 'Purchase Orders', icon: <ShoppingCart /> },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)]">
      <div className="flex h-14 items-center px-4 border-b border-[var(--sidebar-border)]">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.svg" alt="Tracker 360" width={140} height={32} priority />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]'
                  : 'hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
              )}
            >
              <span className="[&_svg]:h-4 [&_svg]:w-4 shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <NavBar
          groups={[{ items: navItems }]}
          user={{ name: 'Dev User', email: 'dev@tendertrack360.co.za' }}
          logoSrc="/logo.svg"
          logoIconSrc="/logo-icon.svg"
          breadcrumbs={<DynamicBreadcrumb />}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
