'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useSearchParams } from 'next/navigation';
import { isNavActive, isPathInSection } from '@/lib/nav-utils';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { getUnreadTicketCount } from '@/server/support';

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  minRole?: string;
  items?: {
    title: string;
    url: string;
  }[];
};

export function NavMain({
  items,
  label = 'Platform',
}: {
  items: NavItem[];
  label?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  useEffect(() => {
    const hasSupport = items.some(
      (item) =>
        item.url === '/support' || item.items?.some((s) => s.url === '/support')
    );
    if (!hasSupport) return;

    let mounted = true;
    const fetchCount = () => {
      getUnreadTicketCount().then((res) => {
        if (mounted && res.success) {
          setUnreadSupportCount(res.count);
        }
      });
    };

    fetchCount();

    const handleUpdate = () => {
      fetchCount();
    };

    window.addEventListener('support-count-updated', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('support-count-updated', handleUpdate);
    };
  }, [pathname, items]);

  const isNavUrlActive = (url: string) =>
    isNavActive(pathname, searchParams, url);

  const isPathMatching = (url: string) => isPathInSection(pathname, url);

  // Initialize collapsible state only for items that actually have sub-items
  const hasCollapsibleItems = items.some(
    (item) => item.items && item.items.length > 0
  );

  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    if (!hasCollapsibleItems) return {};
    const initialState: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.items && item.items.length > 0) {
        initialState[item.title] = item.items.some((sub) =>
          isPathMatching(sub.url)
        );
      }
    });
    return initialState;
  });

  useEffect(() => {
    if (!hasCollapsibleItems) return;
    setOpenItems((prev) => {
      const next: Record<string, boolean> = {};
      let changed = false;
      items.forEach((item) => {
        if (item.items && item.items.length > 0) {
          const shouldOpen = item.items.some((sub) => isPathMatching(sub.url));
          next[item.title] = shouldOpen;
          if (shouldOpen !== prev[item.title]) changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [pathname, items, hasCollapsibleItems]);

  const toggleItem = (itemTitle: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [itemTitle]: !prev[itemTitle],
    }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const active = isNavUrlActive(item.url);

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={active}
                  asChild
                  className="transition-colors duration-150"
                >
                  <Link href={item.url as Route}>
                    {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                    <span className="group-data-[collapsible=icon]:hidden font-medium text-sm">
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {item.url === '/support' && unreadSupportCount > 0 && (
                  <SidebarMenuBadge>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold bg-amber-500 text-black shadow-sm animate-pulse">
                      {unreadSupportCount}
                    </span>
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              open={openItems[item.title] ?? false}
              onOpenChange={() => toggleItem(item.title)}
              asChild
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={active}
                    className="transition-colors duration-150"
                  >
                    {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                    <span className="group-data-[collapsible=icon]:hidden font-medium text-sm">
                      {item.title}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.url === '/support' && unreadSupportCount > 0 && (
                  <SidebarMenuBadge>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold bg-amber-500 text-black shadow-sm animate-pulse">
                      {unreadSupportCount}
                    </span>
                  </SidebarMenuBadge>
                )}
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isNavUrlActive(subItem.url)}
                        >
                          <Link href={subItem.url as Route}>
                            <span className="group-data-[collapsible=icon]:hidden">
                              {subItem.title}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

