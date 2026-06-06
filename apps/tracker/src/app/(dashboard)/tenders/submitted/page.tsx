import { getCurrentUser } from '@/server';
import { getTenders } from '@/server/tenders';
import { TenderList } from '@/components/tenders/tender-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, Plus, Send } from 'lucide-react';
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

  const tendersResult = await getTenders(
    session.activeOrganizationId,
    '',
    1,
    10,
    'submitted-pending'
  );

  const submittedTenders = tendersResult.tenders || [];

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
            <Link href="/tenders/create">
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
            <CardTitle className="text-sm font-medium">Evaluation</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {submittedTenders.filter((t) => t.status === 'evaluation').length}
            </div>
            <p className="text-xs text-muted-foreground">Under evaluation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awarded</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submittedTenders.filter((t) => t.status === 'awarded').length}
            </div>
            <p className="text-xs text-muted-foreground">Successful outcomes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tendersResult.totalCount}
            </div>
            <p className="text-xs text-muted-foreground">
              All active submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tender List */}
      {submittedTenders.length > 0 ? (
        <TenderList
          organizationId={session.activeOrganizationId}
          initialTenders={submittedTenders}
          initialTotalCount={tendersResult.totalCount}
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
