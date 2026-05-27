import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb';
import { AppSidebarWrapper } from '@/components/shared/navigation';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { checkUserSession } from '@/lib/session-check';
import { getNotifications } from '@/server/notifications';
import { NotificationBell } from '@/components/notifications/notification-bell';

// Force dynamic rendering for dashboard layout since it uses server functions with headers
export const dynamic = 'force-dynamic';

export default async function MainDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionCheck = await checkUserSession();
  let notifications: any[] = [];
  let unreadCount = 0;

  if (sessionCheck.hasSession && sessionCheck.hasOrganization) {
    const result = await getNotifications(sessionCheck.activeOrganizationId!);
    if (result.success) {
      notifications = result.notifications;
      unreadCount = result.unreadCount;
    }
  }

  return (
    <div className="h-screen flex w-full">
      <SidebarProvider>
        <AppSidebarWrapper />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DynamicBreadcrumb />
              <div className="ml-auto">
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  organizationId={sessionCheck.activeOrganizationId || ''}
                />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
