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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: {
    title: string;
    url: string;
  }[];
};

export function NavMain({ items, label = "Platform" }: { items: NavItem[]; label?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isNavUrlActive = (url: string) =>
    isNavActive(pathname, searchParams, url);

  const isPathMatching = (url: string) =>
    isPathInSection(pathname, url);

  // Initialize collapsible state from pathname — consistent on server and client
  // to prevent the flash of collapsed-then-expanded on navigation.
  // Accordion: at most one group open at a time.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    let found = false;
    items.forEach((item) => {
      if (item.items && item.items.length > 0) {
        if (!found && item.items.some((sub) => isPathMatching(sub.url))) {
          initialState[item.title] = true;
          found = true;
        } else {
          initialState[item.title] = false;
        }
      }
    });
    return initialState;
  });

  // Accordion: on pathname change, open the matching group and close all others.
  useEffect(() => {
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
  }, [pathname, items]);

  // Accordion toggle: clicking a group closes all others and opens the clicked one.
  const toggleItem = (itemTitle: string) => {
    setOpenItems((prev) => {
      const wasOpen = prev[itemTitle] ?? false;
      const next: Record<string, boolean> = {};
      items.forEach((item) => {
        if (item.items && item.items.length > 0) {
          next[item.title] = false;
        }
      });
      if (!wasOpen) next[itemTitle] = true;
      return next;
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
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
                  isActive={isNavUrlActive(item.url)}
                  asChild={!item.items || item.items.length === 0}
                >
                  {!item.items || item.items.length === 0 ? (
                    <Link href={item.url as Route}>
                      {item.icon && <item.icon />}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  ) : (
                    <>
                      {item.icon && <item.icon />}
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && item.items.length > 0 && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
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
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
