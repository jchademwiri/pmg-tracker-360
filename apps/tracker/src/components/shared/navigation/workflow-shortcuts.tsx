'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useSearchParams } from 'next/navigation';
import { isNavActive } from '@/lib/nav-utils';
import { Clock, Award, AlertTriangle } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getWorkflowCounts } from '@/server/dashboard-urgency';

interface WorkflowShortcutsProps {
  organizationId?: string | null;
}

type ShortcutItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
};

export function WorkflowShortcuts({ organizationId }: WorkflowShortcutsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (url: string) => isNavActive(pathname, searchParams, url);

  const [counts, setCounts] = useState({
    closingSoon: 0,
    awardedAwaitingConversion: 0,
    overdue: 0,
  });

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    getWorkflowCounts(organizationId).then((result) => {
      if (!cancelled && result.success) {
        setCounts(result.counts);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const totalUrgent =
    counts.closingSoon + counts.awardedAwaitingConversion + counts.overdue;

  // Don't render if there's nothing urgent
  if (totalUrgent === 0) return null;

  const shortcuts: ShortcutItem[] = [
    ...(counts.overdue > 0
      ? [
          {
            title: 'Overdue Items',
            url: '/tenders?status=open' as Route,
            icon: AlertTriangle,
            count: counts.overdue,
            color: 'bg-red-500 text-white',
          },
        ]
      : []),
    ...(counts.closingSoon > 0
      ? [
          {
            title: 'Closing Soon',
            url: '/tenders?status=open' as Route,
            icon: Clock,
            count: counts.closingSoon,
            color: 'bg-amber-500 text-white',
          },
        ]
      : []),
    ...(counts.awardedAwaitingConversion > 0
      ? [
          {
            title: 'Awarded – Convert',
            url: '/tenders?status=awarded' as Route,
            icon: Award,
            count: counts.awardedAwaitingConversion,
            color: 'bg-green-500 text-white',
          },
        ]
      : []),
  ];

  if (shortcuts.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs text-muted-foreground/70">
        Needs Action
      </SidebarGroupLabel>
      <SidebarMenu>
        {shortcuts.map((item) => {
          const active = isActive(item.url);
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} isActive={active} asChild>
                <Link href={item.url}>
                  <item.icon className={active ? 'text-foreground' : 'text-muted-foreground'} />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuBadge>
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${item.color}`}
                >
                  {item.count}
                </span>
              </SidebarMenuBadge>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
