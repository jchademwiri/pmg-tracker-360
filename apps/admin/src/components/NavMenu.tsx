'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  LifeBuoy,
  MessageSquare,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Tenants',
    items: [
      { href: '/organizations', label: 'Organizations', icon: Building2 },
      { href: '/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'Support & Growth',
    items: [
      { href: '/support-tickets', label: 'Support Tickets', icon: LifeBuoy },
      { href: '/feedback', label: 'Feedback', icon: MessageSquare },
    ],
  },
  {
    label: 'Security',
    items: [{ href: '/sessions', label: 'Sessions', icon: ShieldAlert }],
  },
];

export default function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 px-2">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[oklch(0.25_0.02_255)] text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
