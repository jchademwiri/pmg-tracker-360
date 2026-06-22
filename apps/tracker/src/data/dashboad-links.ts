import {
  Calendar,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Building2,
} from 'lucide-react';

export const dashboadLinks = {
  mainHub: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
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
      title: 'Tender Management',
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
      title: 'Project Delivery',
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
    {
      title: 'Clients Directory',
      url: '/clients',
      icon: Users,
    },
  ],
  settings: [
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    },
    {
      title: 'Organizations',
      url: '/organization',
      icon: Building2,
    },
  ],
};
