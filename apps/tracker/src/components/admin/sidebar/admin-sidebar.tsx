'use client';

import * as React from 'react';
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  LayoutDashboard,
  Users,
  Building2,
} from 'lucide-react';

import { NavMain } from '@/components/admin/sidebar/nav-main';
import { NavProjects } from '@/components/admin/sidebar/nav-projects';
import { NavSecondary } from '@/components/admin/sidebar/nav-secondary';
import { NavUser } from '@/components/admin/sidebar/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Sample data - This should ideally come from props or a config file
const sidebarData = {
  navMain: [
    {
      title: 'Admin Management',
      url: '#',
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
        },
        {
          title: 'Users',
          url: '/admin/users',
        },
        {
          title: 'Organizations',
          url: '/admin/organizations',
        },
      ],
    },
    // Retaining some original example items for "sidebar-08" fidelity,
    // but commenting them out or adapting them could be better.
    // I'll keep them as "Planned Features" for now or similar to show the UI potential.
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Roles & Permissions',
          url: '#',
        },
        {
          title: 'Audit Log',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
  projects: [
    {
      name: 'System Reports',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Analytics',
      url: '#',
      icon: PieChart,
    },
  ],
};

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  // Construct user object for NavUser, handling potential missing fields
  const userData = {
    name: user.name || 'Admin User',
    email: user.email || '',
    avatar: (user as any).image || user.avatar || '',
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Tender Track 360</span>
                  <span className="truncate text-xs">Admin Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavProjects projects={sidebarData.projects} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
