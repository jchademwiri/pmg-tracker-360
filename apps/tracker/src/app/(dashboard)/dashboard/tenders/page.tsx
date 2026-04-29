import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { getTenders } from '@/server/tenders';
import { TendersTable } from '@/components/tenders/tenders-table';
import { Button } from '@pmg/ui/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tenders' };

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');

  const params = await searchParams;
  const organizationId = session.activeOrganizationId!;
  const page = parseInt(params.page ?? '1');

  const result = await getTenders(organizationId, params.search, page, 10, params.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenders</h1>
          <p className="text-muted-foreground">Manage and track your tender submissions.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tenders/create">
            <Plus className="mr-2 h-4 w-4" />
            New Tender
          </Link>
        </Button>
      </div>
      <TendersTable
        tenders={result.tenders}
        totalCount={result.totalCount}
        currentPage={result.currentPage}
        totalPages={result.totalPages}
      />
    </div>
  );
}
