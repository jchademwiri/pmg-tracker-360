import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { getOrganizationsWithCounts } from '@/lib/admin-queries';
import OrgListClient from './OrgListClient';

export default async function AdminOrganizationsPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Fetch all organisations with aggregate counts
  const orgs = await getOrganizationsWithCounts();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Building2 className="h-8 w-8 text-indigo-400" />
          Organizations
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Monitor, audit, and manage tenant workspaces across the Tender Track 360 platform.
        </p>
      </div>

      {/* Client component handles filtering, search, table, and drawer */}
      <OrgListClient orgs={orgs} />
    </div>
  );
}
