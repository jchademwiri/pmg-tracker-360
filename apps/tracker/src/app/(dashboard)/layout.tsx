import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb';
import { AppSidebarClient } from '@/components/shared/navigation';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { checkUserSession } from '@/lib/session-check';
import { getNotifications } from '@/server/notifications';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileBottomNav } from '@/components/ui/mobile-bottom-nav';
import {
  getActiveOrganizations,
  getUserOrganizationMembership,
} from '@/server/organizations';
import { getCurrentUser } from '@/server/users';

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

  const organizations = await getActiveOrganizations();
  const { currentUser, session } = await getCurrentUser();

  // Fetch current user's role in the active organization
  let role = 'member'; // Default to lowest permission
  if (currentUser && session?.activeOrganizationId) {
    const membership = await getUserOrganizationMembership(
      currentUser.id,
      session.activeOrganizationId
    );
    if (membership) {
      role = membership.role;
    }
  }

  return (
    <div className="h-screen flex w-full">
      <SidebarProvider>
        <AppSidebarClient
          initialOrganizations={organizations}
          initialUser={currentUser}
          userRole={role}
          activeOrganizationId={session?.activeOrganizationId}
        />
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
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-20 md:pb-4 overflow-y-auto">
            {children}
          </div>
          <MobileBottomNav />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
