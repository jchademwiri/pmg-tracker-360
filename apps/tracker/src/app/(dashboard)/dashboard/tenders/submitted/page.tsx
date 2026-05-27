import { getCurrentUser } from '@/server';
import { getTendersWithCustomSorting } from '@/server/tenders';
import { TenderList } from '@/components/tenders/tender-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SubmittedTendersPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view submitted tenders.
          </p>
        </div>
      </div>
    );
  }

  // Fetch submitted tenders with custom sorting (excludes drafts by default)
  // Get all non-draft tenders and filter client-side for submitted/pending view
  const tendersResult = await getTendersWithCustomSorting(
    session.activeOrganizationId,
    1,
    100
  );

  const allSubmittedTenders = tendersResult.success
    ? tendersResult.tenders
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Submitted Tenders
          </h1>
          <p className="text-muted-foreground">
            Track tenders awaiting results and follow up on submissions.
          </p>
        </div>
        <div>
          <Button asChild size={'lg'}>
            <Link href="/dashboard/tenders/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Tender
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allSubmittedTenders.filter(t => t.status === 'submitted').length}
            </div>
            <p className="text-xs text-muted-foreground">Recently submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {allSubmittedTenders.filter(t => t.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allSubmittedTenders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All active submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tender List */}
      {allSubmittedTenders.length > 0 ? (
        <TenderList
          organizationId={session.activeOrganizationId}
          initialTenders={allSubmittedTenders}
          initialTotalCount={allSubmittedTenders.length}
          defaultStatusFilter="submitted-pending"
          pageType="submitted"
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Submitted Tenders
            </h3>
            <p className="text-muted-foreground text-center">
              You haven&#x27;t submitted any tenders yet. Create and submit your
              first tender to track it here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
