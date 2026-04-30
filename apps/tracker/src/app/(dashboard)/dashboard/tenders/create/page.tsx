import { TenderForm } from '@/components/tenders/tender-form';
import { redirect } from 'next/navigation';
import { checkUserSession } from '@/lib/session-check';

export const dynamic = 'force-dynamic';

export default async function NewTenderPage() {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to create tenders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenderForm organizationId={session.activeOrganizationId} mode="create" />
  );
}
