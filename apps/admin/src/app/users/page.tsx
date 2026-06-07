import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { getUsersWithMemberships } from '@/lib/admin-queries';
import { InviteAdminModal } from './components/invite-admin-modal';
import UserListClient from './UserListClient';

export default async function AdminUsersPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Fetch users with memberships
  const users = await getUsersWithMemberships();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-(--primary)" />
            Users
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Inspect, audit, and manage all user accounts registered across the platform.
          </p>
        </div>
        <div className="flex items-center">
          <InviteAdminModal />
        </div>
      </div>

      {/* 3. Client-side filter + table */}
      <UserListClient users={users} />
    </div>
  );
}
