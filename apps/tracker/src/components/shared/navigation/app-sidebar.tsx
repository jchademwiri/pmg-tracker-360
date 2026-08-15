'use client';

import * as React from 'react';
import { useMemo } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { OrganizationWithStats } from '@/server/organizations';
import type { User } from '@pmg/db/schema';
import { dashboadLinks } from '@/data/dashboad-links';

import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import { NavMain } from './nav-main';
import { WorkflowShortcuts } from './workflow-shortcuts';

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
  // Filter operations links based on role permissions
  const operationsItems = useMemo(() => {
    return dashboadLinks.operations.filter((item) => {
      if (item.minRole === 'manager' && userRole === 'member') {
        return false;
      }
      return true;
    });
  }, [userRole]);

  const insightsItems = useMemo(() => {
    return dashboadLinks.insights;
  }, []);

  const settingsItems = useMemo(() => {
    return dashboadLinks.settings;
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={operationsItems} label="Operations" />
        <WorkflowShortcuts organizationId={activeOrganizationId} />
        <NavMain items={insightsItems} label="Planning & Insights" />
        <NavMain items={settingsItems} label="Management" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

