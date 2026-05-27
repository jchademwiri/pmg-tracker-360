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
      isActive: true,
    },
    {
      title: 'Tender Management',
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
          title: 'Submitted',
          url: '/dashboard/tenders/submitted',
        },
        // {
        //   title: 'Proposals',
        //   url: '/dashboard/tenders/proposals',
        // },
        // {
        //   title: 'Documents',
        //   url: '/dashboard/tenders/documents',
        // },
      ],
    },

    {
      title: 'Project Management',
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
          title: 'Purchase Orders', // Can not be visible to the role of member
          url: '/dashboard/projects/purchase-orders',
        },
        // {
        //   title: 'Contracts', // Can not be visible to the role of member
        //   url: '/dashboard/projects/contracts',
        // },
        // {
        //   title: 'PO Status Tracker',
        //   url: '/dashboard/projects/po-tracker',
        // },
        // {
        //   title: 'Project Timeline',
        //   url: '/dashboard/projects/timeline',
        // },
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
