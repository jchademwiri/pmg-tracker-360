import {
  Calendar,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Building2,
  LifeBuoy,
  Truck,
} from 'lucide-react';

export const dashboadLinks = {
  operations: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Tenders',
      url: '/tenders',
      icon: ClipboardList,
    },
    {
      title: 'Projects',
      url: '/projects',
      icon: FolderKanban,
    },
    {
      title: 'Purchase Orders',
      url: '/projects/purchase-orders',
      icon: Truck,
      minRole: 'manager', // Hide for standard 'member' role
    },
    {
      title: 'Clients',
      url: '/clients',
      icon: Users,
    },
  ],
  insights: [
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
  settings: [
    {
      title: 'Organizations',
      url: '/organization',
      icon: Building2,
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
    },
    {
      title: 'Support Desk',
      url: '/support',
      icon: LifeBuoy,
    },
  ],
};

