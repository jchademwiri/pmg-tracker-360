import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getUsersWithMemberships } from '@/lib/admin-queries';
import { selectSystemAdmins } from '@/lib/user-scopes';
import { InviteAdminModal } from '../users/components/invite-admin-modal';
import SystemAdminListClient from './SystemAdminListClient';

export default async function SystemAdminsPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Platform staff only — organisation members live on /users
  const admins = selectSystemAdmins(await getUsersWithMemberships());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-(--primary)" />
            System Admins
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Platform staff with access to this console. Organisation members and
            their roles are listed under Users.
          </p>
        </div>
        <div className="flex items-center">
          <InviteAdminModal />
        </div>
      </div>

      {/* 3. Client-side filter + table */}
      <SystemAdminListClient admins={admins} currentUserId={session.user.id} />
    </div>
  );
}
