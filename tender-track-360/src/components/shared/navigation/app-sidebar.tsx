'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { OrganizationWithStats } from '@/server/organizations';
import type { User } from '@/db/schema';
import { dashboadLinks } from '@/data/dashboad-links';
import { useMemo } from 'react';

import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import { NavMain } from './nav-main';

// This is sample data.

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organizations: OrganizationWithStats[];
  user: User;
  userRole: string;
  activeOrganizationId?: string | null;
}

export function AppSidebar({
  organizations,
  user,
  userRole,
  activeOrganizationId,
  ...props
}: AppSidebarProps) {
  // Filter links based on role
  const navItems = useMemo(() => {
    return dashboadLinks.navMain.map((item) => {
      // If item has sub-items, filter them
      if (item.items) {
        const filteredSubItems = item.items.filter((subItem) => {
          // HIDE Purchase Orders for 'member' role
          if (subItem.title === 'Purchase Orders' && userRole === 'member') {
            return false;
          }
          return true;
        });

        return {
          ...item,
          items: filteredSubItems,
        };
      }
      return item;
    });
  }, [userRole]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
