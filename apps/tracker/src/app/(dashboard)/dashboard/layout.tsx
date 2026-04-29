import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await checkUserSession();

  if (!session.hasSession) redirect('/login');
  if (!session.hasOrganization) redirect('/onboarding');

  return <DashboardShell>{children}</DashboardShell>;
}
