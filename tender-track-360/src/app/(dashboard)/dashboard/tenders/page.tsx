import { getCurrentUser } from '@/server';
import { getTenders, getTenderStats } from '@/server/tenders';
import { TenderList } from '@/components/tenders/tender-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Banknote,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TendersPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to manage tenders.
          </p>
        </div>
      </div>
    );
  }

  // Fetch initial draft tenders and stats (show only drafts by default)
  const [tendersResult, statsResult] = await Promise.all([
    getTenders(session.activeOrganizationId, '', 1, 10, 'draft'),
    getTenderStats(session.activeOrganizationId),
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalTenders: 0,
        statusCounts: {
          draft: 0,
          submitted: 0,
          won: 0,
          lost: 0,
          pending: 0,
        },
        totalValue: 0,
      };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenders</h1>
          <p className="text-muted-foreground">
            Manage and track your tender applications and opportunities.
          </p>
        </div>
        <Button asChild size={'lg'}>
          <Link href="/dashboard/tenders/create">
            <Plus className="h-4 w-4 mr-2" />
            Add Tender
          </Link>
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenders}</div>
            <p className="text-xs text-muted-foreground">
              All tender applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.statusCounts.won}
            </div>
            <p className="text-xs text-muted-foreground">Successful tenders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.statusCounts.pending + stats.statusCounts.submitted}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.statusCounts.lost}
            </div>
            <p className="text-xs text-muted-foreground">
              Unsuccessful tenders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined tender value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tender List */}
      <TenderList
        organizationId={session.activeOrganizationId}
        initialTenders={tendersResult.tenders}
        initialTotalCount={tendersResult.totalCount}
        defaultStatusFilter="draft"
        showStatusToggle={true}
        pageType="active"
      />
    </div>
  );
}
