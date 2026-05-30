import {
  Calendar,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Users,
  BarChart3,
} from 'lucide-react';

export const dashboadLinks = {
  mainHub: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: true,
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
  ],
  procurement: [
    {
      title: 'Clients Directory',
      url: '/dashboard/clients',
      icon: Users,
    },
    {
      title: 'Tender Pipeline',
      url: '#',
      icon: ClipboardList,
      items: [
        {
          title: 'Overview',
          url: '/dashboard/tenders/overview',
        },
        {
          title: 'Active Tenders',
          url: '/dashboard/tenders',
        },
        {
          title: 'Submitted Tenders',
          url: '/dashboard/tenders/submitted',
        },
      ],
    },
    {
      title: 'Project Tracking',
      url: '#',
      icon: FolderKanban,
      items: [
        {
          title: 'Overview',
          url: '/dashboard/projects/overview',
        },
        {
          title: 'Active Projects',
          url: '/dashboard/projects',
        },
        {
          title: 'Purchase Orders', // Hidden for standard 'member' role
          url: '/dashboard/projects/purchase-orders',
        },
      ],
    },
  ],
};
