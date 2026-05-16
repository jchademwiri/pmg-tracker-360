'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

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
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize state for each collapsible item - start with server-safe defaults
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.items && item.items.length > 0) {
        // Use only isActive for initial server render to avoid hydration mismatch
        initialState[item.title] = item.isActive || false;
      }
    });
    return initialState;
  });

  // Handle hydration and pathname-based state updates
  useEffect(() => {
    setIsHydrated(true);

    // After hydration, update state based on current pathname
    setOpenItems((prev) => {
      const newState = { ...prev };
      items.forEach((item) => {
        if (item.items && item.items.length > 0) {
          const hasActiveSubItem = item.items.some((subItem) =>
            pathname.startsWith(subItem.url)
          );
          if (hasActiveSubItem) {
            newState[item.title] = true;
          }
        }
      });
      return newState;
    });
  }, [pathname, items]);

  const toggleItem = (itemTitle: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [itemTitle]: !prev[itemTitle],
    }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            open={isHydrated ? openItems[item.title] : item.isActive || false}
            onOpenChange={() => toggleItem(item.title)}
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
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
                        <SidebarMenuSubButton asChild>
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
