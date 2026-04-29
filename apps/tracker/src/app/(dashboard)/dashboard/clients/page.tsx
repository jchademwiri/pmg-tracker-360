import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { getClients } from '@/server/clients';
import { ClientsTable } from '@/components/clients/clients-table';
import { Button } from '@pmg/ui/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clients' };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');

  const params = await searchParams;
  const organizationId = session.activeOrganizationId!;
  const page = parseInt(params.page ?? '1');

  const result = await getClients(organizationId, params.search, page, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client relationships.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/create">
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Link>
        </Button>
      </div>
      <ClientsTable
        clients={result.clients}
        totalCount={result.totalCount}
        currentPage={result.currentPage}
        totalPages={result.totalPages}
      />
    </div>
  );
}
