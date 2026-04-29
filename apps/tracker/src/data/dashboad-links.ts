import {
  Calendar,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Users,
  BarChart3,
} from 'lucide-react';

export const dashboadLinks = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Tenders',
      url: '/dashboard/tenders',
      icon: ClipboardList,
      items: [
        {
          title: 'Overview',
          url: '/dashboard/tenders',
        },
        {
          title: 'Submitted',
          url: '/dashboard/tenders/submitted',
        },
      ],
    },
    {
      title: 'Projects',
      url: '/dashboard/projects',
      icon: FolderKanban,
      items: [
        {
          title: 'Overview',
          url: '/dashboard/projects',
        },
        {
          title: 'Active Projects',
          url: '/dashboard/projects/active',
        },
        {
          title: 'Purchase Orders',
          url: '/dashboard/purchase-orders',
        },
      ],
    },
    {
      title: 'Calendar',
      url: '/dashboard/calendar',
      icon: Calendar,
    },
    {
      title: 'Reports',
      url: '/dashboard/reports',
      icon: BarChart3,
    },
    {
      title: 'Clients',
      url: '/dashboard/clients',
      icon: Users,
    },
  ],
};
