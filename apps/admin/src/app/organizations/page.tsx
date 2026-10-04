import { requireAdminPage } from "@/lib/require-admin-page";
import { Building2 } from "lucide-react";
import {
  getOrganizationsWithCounts,
  getInvitationsWithDetails,
} from "@/lib/admin-queries";
import OrganizationsManagementClient from "./OrganizationsManagementClient";

type AdminOrganizationsPageProps = {
  searchParams?: Promise<{ tab?: string; filter?: string }>;
};

export default async function AdminOrganizationsPage({
  searchParams,
}: AdminOrganizationsPageProps) {
  // 1. Auth guard
  await requireAdminPage();

  const params = searchParams ? await searchParams : {};
  const initialTab =
    params.tab === "invitations" ? "invitations" : "organizations";

  // 2. Fetch all organisations and invitations in parallel
  const [orgs, invitations] = await Promise.all([
    getOrganizationsWithCounts(),
    getInvitationsWithDetails(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Building2 className="h-8 w-8 text-indigo-400" />
          Organizations & Workspaces
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Monitor, audit, and manage tenant workspaces, memberships, and pending invitations across the platform.
        </p>
      </div>

      {/* Tabbed client component for Organizations and Invitations */}
      <OrganizationsManagementClient
        orgs={orgs}
        invitations={invitations}
        initialTab={initialTab}
        initialFilter={params.filter}
      />
    </div>
  );
}
