import {
  getCurrentUser,
  getClients,
  getClientStats,
  getClientsExportCsv,
} from "@/server";
import { ClientList } from "@/components/clients/client-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  Download,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { session } = await getCurrentUser();

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground">
            Please select an organization to manage clients.
          </p>
        </div>
      </div>
    );
  }

  // Fetch initial clients and stats
  const [clientsResult, statsResult] = await Promise.all([
    getClients(session.activeOrganizationId, "", 1, 10),
    getClientStats(session.activeOrganizationId),
  ]);

  const stats = statsResult.success
    ? statsResult.stats
    : {
        totalClients: 0,
        clientsWithContact: 0,
        clientsWithoutContact: 0,
        clientsThisMonth: 0,
      };

  // Generate CSV export link
  const csvResult = await getClientsExportCsv(session.activeOrganizationId);
  const csvData = csvResult.success ? csvResult.csv : null;
  const csvFilename = csvResult.success
    ? csvResult.filename
    : "clients-export.csv";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your client relationships and contact information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {csvData && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 font-medium shadow-xs"
            >
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
                download={csvFilename}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </a>
            </Button>
          )}
          <Button asChild size="sm" className="h-9 font-medium shadow-xs">
            <Link href="/clients/create">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Client
            </Link>
          </Button>
        </div>
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
                : "No clients yet"}
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
            <div className="text-2xl font-bold">+{stats.clientsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Clients added this month
            </p>
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
