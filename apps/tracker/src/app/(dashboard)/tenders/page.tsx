import { getCurrentUser } from '@/server';
import { getTendersOverview } from '@/server/tenders';
import { getClients } from '@/server/clients';
import { Plus } from 'lucide-react';
import { TendersOverviewClient } from './overview/client-wrapper';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type SearchParams = {
  search?: string;
  status?: string;
  clientId?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
};

const validSortBy = ['tenderNumber', 'createdAt', 'submissionDate', 'status'] as const;
const validSortOrder = ['asc', 'desc'] as const;

function parseTenderFilters(searchParams: SearchParams) {
  const status = searchParams.status || 'all';
  const sortBy = validSortBy.includes(searchParams.sortBy as any)
    ? (searchParams.sortBy as (typeof validSortBy)[number])
    : status === 'open' || status === 'all'
      ? 'submissionDate'
      : 'createdAt';
  const sortOrder = validSortOrder.includes(searchParams.sortOrder as any)
    ? (searchParams.sortOrder as (typeof validSortOrder)[number])
    : status === 'open' || status === 'all'
      ? 'asc'
      : 'desc';
  const page = Math.max(Number(searchParams.page || '1') || 1, 1);

  return {
    filters: {
      search: searchParams.search || '',
      status,
      clientId: searchParams.clientId || 'all',
      sortBy,
      sortOrder,
    },
    page,
  };
}

function getRegisterCopy(status: string) {
  switch (status) {
    case 'closing_soon':
      return {
        title: 'Closing Soon',
        description: 'Track active tender opportunities closing in the next 14 days.',
      };
    case 'under_preparation':
      return {
        title: 'Under Preparation',
        description: 'Monitor tenders currently being compiled and prepared for submission.',
      };
    case 'awaiting_results':
      return {
        title: 'Awaiting Results',
        description: 'Review submitted tenders currently under evaluation or awaiting outcomes.',
      };
    case 'open':
      return {
        title: 'Open Tenders',
        description: 'Track tender opportunities that are still open for submission.',
      };
    case 'evaluation':
      return {
        title: 'Under Evaluation',
        description: 'Monitor submitted tenders that are currently under evaluation.',
      };
    case 'closed':
      return {
        title: 'Closed Tenders',
        description: 'Review tenders marked as closed.',
      };
    case 'awarded':
      return {
        title: 'Awarded Tenders',
        description: 'Review successful tenders and appointed work.',
      };
    case 'lost':
      return {
        title: 'Lost / Rejected Tenders',
        description: 'Review unsuccessful tender outcomes.',
      };
    default:
      return {
        title: 'Tender Register',
        description: 'Search, filter, and manage all tender records from one place.',
      };
  }
}

export default async function TendersRegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { session } = await getCurrentUser();
  const { filters, page } = parseTenderFilters(await searchParams);
  const registerCopy = getRegisterCopy(filters.status);

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view tenders.
          </p>
        </div>
      </div>
    );
  }

  // Fetch tenders and clients in parallel
  const [tendersResult, clientsResult] = await Promise.all([
    getTendersOverview(session.activeOrganizationId, filters, page, 20),
    getClients(session.activeOrganizationId),
  ]);

  const tendersData = tendersResult.success
    ? tendersResult
    : {
        tenders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      };

  const clients = clientsResult.clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {registerCopy.title}
          </h1>
          <p className="text-muted-foreground">
            {registerCopy.description}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/tenders/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Tender
          </Link>
        </Button>
      </header>

      <TendersOverviewClient
        initialTenders={tendersData.tenders}
        initialTotalCount={tendersData.totalCount}
        initialCurrentPage={tendersData.currentPage}
        initialTotalPages={tendersData.totalPages}
        initialFilters={filters}
        clients={clients}
        organizationId={session.activeOrganizationId}
        basePath="/tenders"
      />
    </div>
  );
}
