'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  LifeBuoy,
  MessageSquare,
  ShieldAlert,
  Shield,
  Database,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { adminSignOut } from '@/app/actions';

/* ------------------------------------------------------------------ */
/*  Navigation data                                                    */
/* ------------------------------------------------------------------ */

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
  {
    label: 'Operations',
    items: [{ href: '/backups', label: 'Backups', icon: Database }],
  },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AdminSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initial = userName?.[0]?.toUpperCase() ?? 'A';

  function handleSignOut() {
    startTransition(async () => {
      await adminSignOut();
    });
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Branded Header ─────────────────────────────────────── */}
      <SidebarHeader className="border-b border-[var(--sidebar-border)] bg-[oklch(0.16_0.02_255)] p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[var(--sidebar-primary)] animate-pulse shrink-0" />
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg tracking-wider text-white">
              PLATFORM{' '}
              <span className="text-[var(--sidebar-primary)]">ADMIN</span>
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer / User ──────────────────────────────────────── */}
      <Separator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={userName ?? 'Admin'}
              onClick={handleSignOut}
              disabled={isPending}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] font-bold text-sm shrink-0">
                {initial}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {userName ?? 'Admin'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {userEmail ?? ''}
                </span>
              </div>
              <LogOut className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
