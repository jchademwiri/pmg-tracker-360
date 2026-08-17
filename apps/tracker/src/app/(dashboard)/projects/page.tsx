import { getCurrentUser } from "@/server";
import { getProjects } from "@/server/projects";
import { getClientsList } from "@/server/clients";
import { ProjectList } from "@/components/projects/project-list";
import { Button } from "@/components/ui";
import Link from "next/link";
import { Plus } from "lucide-react";
import { NoOrganizationState } from "@/components/shared/empty-states";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { session } = await getCurrentUser();
  const { auth } = await import("@/lib/auth");
  const { headers } = await import("next/headers");
  const headersList = await headers();

  if (!session.activeOrganizationId) {
    return <NoOrganizationState />;
  }

  // Fetch initial projects and clients list in parallel
  const [result, clientsResult] = await Promise.all([
    getProjects(session.activeOrganizationId, "", 1, 10),
    getClientsList(session.activeOrganizationId),
  ]);

  const initialProjects = result.projects;
  const initialTotalCount = result.totalCount;
  const clients = clientsResult.success ? clientsResult.clients : [];

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage and track all your construction projects.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {(
            await auth.api.hasPermission({
              headers: headersList,
              body: {
                permissions: {
                  project: ["create"],
                },
              },
            })
          ).success && (
            <Button asChild size="sm" className="h-9 font-medium shadow-xs">
              <Link href="/projects/create">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Project
              </Link>
            </Button>
          )}

          {(
            await auth.api.hasPermission({
              headers: headersList,
              body: {
                permissions: {
                  purchase_order: ["create"],
                },
              },
            })
          ).success && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 font-medium shadow-xs"
            >
              <Link href="/projects/purchase-orders/create">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Purchase Order
              </Link>
            </Button>
          )}
        </div>
      </header>

      <ProjectList
        organizationId={session.activeOrganizationId}
        initialProjects={initialProjects}
        initialTotalCount={initialTotalCount}
        clients={clients}
      />
    </div>
  );
}
