import { redirect } from 'next/navigation';
import { getOrganizationSelectionState } from '@/server/organizations';
import { getCurrentUser } from '@/server';
import { SessionUserSync } from '@/components/shared/session-user-sync';
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

  const { currentUser } = await getCurrentUser();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <SessionUserSync
        user={{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        }}
      />
      <OrganizationSelectClient organizations={organizations} />
    </div>
  );
}
