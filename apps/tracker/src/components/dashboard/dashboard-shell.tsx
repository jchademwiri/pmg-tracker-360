'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { NavBar } from '@pmg/ui/components/shared/nav-bar';
import { cn } from '@pmg/ui/lib/utils';
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb';
import { dashboadLinks } from '@/data/dashboad-links';

// Mobile nav items (flat list for the sheet)
const mobileNavItems = dashboadLinks.navMain.flatMap((item) =>
  item.items
    ? item.items.map((sub) => ({ href: sub.url, label: sub.title, icon: null }))
    : [{ href: item.url, label: item.title, icon: null }]
);

function SidebarNav() {
  const pathname = usePathname();

  // Track which groups are open — default open if any child is active
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    dashboadLinks.navMain.forEach((item) => {
      if (item.items) {
        const hasActive = item.items.some((sub) => {
          const isOverview = sub.title === 'Overview';
          return isOverview
            ? pathname === sub.url
            : pathname === sub.url || pathname.startsWith(sub.url + '/');
        });
        // Also open if we're on the parent URL itself (e.g. /dashboard/tenders)
        const onParent = item.url !== '#' && (pathname === item.url || pathname.startsWith(item.url + '/'));
        initial[item.title] = hasActive || onParent;
      }
    });
    return initial;
  });

  const toggle = (title: string) =>
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-(--sidebar) text-(--sidebar-foreground) border-r border-(--sidebar-border)">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-(--sidebar-border)">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.svg" alt="Tracker 360" width={140} height={32} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {dashboadLinks.navMain.map((item) => {
          const Icon = item.icon;
          const isGroupActive =
            item.items?.some(
              (sub) => pathname === sub.url || pathname.startsWith(sub.url + '/')
            ) ?? false;
          const isSingleActive =
            !item.items &&
            (pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url + '/')));

          // Single link
          if (!item.items) {
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isSingleActive
                    ? 'bg-(--sidebar-primary) text-(--sidebar-primary-foreground)'
                    : 'hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)'
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {item.title}
              </Link>
            );
          }

          // Collapsible group
          const isOpen = openGroups[item.title] ?? false;
          return (
            <div key={item.title}>
              <button
                onClick={() => toggle(item.title)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isGroupActive
                    ? 'text-(--sidebar-foreground)'
                    : 'hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)'
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform duration-200 opacity-60',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Sub-items */}
              {isOpen && (
                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-(--sidebar-border) pl-3">
                  {item.items.map((sub) => {
                    // "Overview" sub-items share the parent URL — only exact match
                    // Other sub-items use startsWith so child routes stay highlighted
                    const isOverview = sub.title === 'Overview';
                    const isActive = isOverview
                      ? pathname === sub.url
                      : pathname === sub.url || pathname.startsWith(sub.url + '/');
                    return (
                      <Link
                        key={sub.url}
                        href={sub.url}
                        className={cn(
                          'block rounded-md px-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-(--sidebar-primary) text-(--sidebar-primary-foreground) font-medium'
                            : 'text-(--sidebar-foreground)/70 hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)'
                        )}
                      >
                        {sub.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-(--sidebar-border) p-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-(--sidebar-primary) text-(--sidebar-primary-foreground)'
              : 'hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)'
          )}
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
          groups={[{ items: mobileNavItems }]}
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
