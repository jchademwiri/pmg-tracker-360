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
      url: '/calendar',
      icon: Calendar,
    },
    {
      title: 'Reports',
      url: '/reports',
      icon: BarChart3,
    },
  ],
  procurement: [
    {
      title: 'Clients Directory',
      url: '/clients',
      icon: Users,
    },
    {
      title: 'Tender Pipeline',
      url: '#',
      icon: ClipboardList,
      items: [
        {
          title: 'Overview',
          url: '/tenders/overview',
        },
        {
          title: 'Tender Register',
          url: '/tenders',
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
          url: '/projects/overview',
        },
        {
          title: 'Active Projects',
          url: '/projects',
        },
        {
          title: 'Purchase Orders', // Hidden for standard 'member' role
          url: '/projects/purchase-orders',
        },
      ],
    },
  ],
};
