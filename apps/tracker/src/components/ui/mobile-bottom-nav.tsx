'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Route } from 'next';
import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  Users,
  MoreHorizontal,
  Calendar,
  BarChart3,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPathInSection } from '@/lib/nav-utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tenders', href: '/tenders', icon: ClipboardList },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Clients', href: '/clients', icon: Users },
];

const secondaryItems: NavItem[] = [
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Tender Overview', href: '/tenders/overview', icon: ClipboardList },
  { label: 'Project Overview', href: '/projects/overview', icon: FolderKanban },
  { label: 'Purchase Orders', href: '/projects/purchase-orders', icon: FolderKanban },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (item: NavItem) =>
    isPathInSection(pathname, item.href);

  return (
    <>
      {/* Overflow menu backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Overflow menu */}
      {menuOpen && (
        <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-white/10 bg-zinc-900 p-2 shadow-2xl md:hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              More
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors',
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-center transition-colors min-w-[60px]',
                  active
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    active && 'bg-white/10'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-center transition-colors min-w-[60px]',
              menuOpen
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                menuOpen && 'bg-white/10'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
