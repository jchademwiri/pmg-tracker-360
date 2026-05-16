import { getCurrentUser } from '@/server';
import { getClients, getClientStats } from '@/server';
import { ClientList } from '@/components/clients/client-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserPlus, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to manage clients.
          </p>
        </div>
      </div>
    );
  }

  // Fetch initial clients and stats
  const [clientsResult, statsResult] = await Promise.all([
    getClients(session.activeOrganizationId, '', 1, 10),
    getClientStats(session.activeOrganizationId),
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalClients: 0,
        clientsWithContact: 0,
        clientsWithoutContact: 0,
      };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your client relationships and contact information.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Active client relationships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              With Contact Info
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientsWithContact}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClients > 0
                ? `${Math.round((stats.clientsWithContact / stats.totalClients) * 100)}% complete`
                : 'No clients yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Missing Contact
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.clientsWithoutContact}
            </div>
            <p className="text-xs text-muted-foreground">
              Need contact information
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Total clients added</p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <ClientList
        organizationId={session.activeOrganizationId}
        initialClients={clientsResult.clients}
        initialTotalCount={clientsResult.totalCount}
      />
    </div>
  );
}
