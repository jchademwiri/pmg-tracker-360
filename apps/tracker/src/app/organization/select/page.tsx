import { redirect } from 'next/navigation';
import { getOrganizationSelectionState } from '@/server/organizations';
import { OrganizationSelectClient } from './organization-select-client';

export const dynamic = 'force-dynamic';

export default async function OrganizationSelectPage() {
  const { organizations, activeOrganizationId } =
    await getOrganizationSelectionState();

  if (activeOrganizationId) {
    redirect('/dashboard');
  }

  if (organizations.length === 0) {
    redirect('/onboarding');
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <OrganizationSelectClient organizations={organizations} />
    </div>
  );
}
