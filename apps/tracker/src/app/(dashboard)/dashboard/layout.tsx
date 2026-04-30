import { redirect } from 'next/navigation';
import { requireSession } from '@pmg/auth/rbac';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validates the session token against the DB.
  // Redirects to /login if no valid session (catches expired tokens
  // that passed the proxy cookie check).
  const session = await requireSession();

  // If the user has no active organization, send them to onboarding.
  if (!session.hasOrganization) {
    redirect('/onboarding');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
