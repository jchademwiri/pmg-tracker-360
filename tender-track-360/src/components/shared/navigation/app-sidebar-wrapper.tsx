import {
  getActiveOrganizations,
  getUserOrganizationMembership,
} from '@/server/organizations';
import { getCurrentUser } from '@/server/users';
import type { ComponentProps } from 'react';
import { AppSidebarClient } from './app-sidebar-client';
// Remove dashboadLinks import to avoid serialization issues

type AppSidebarWrapperProps = Omit<
  ComponentProps<typeof AppSidebarClient>,
  'initialOrganizations' | 'initialUser' | 'userRole'
>;

export async function AppSidebarWrapper(props: AppSidebarWrapperProps) {
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
    <AppSidebarClient
      initialOrganizations={organizations}
      initialUser={currentUser}
      userRole={role}
      activeOrganizationId={session?.activeOrganizationId}
      {...props}
    />
  );
}
