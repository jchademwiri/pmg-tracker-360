import { requireAdminPage } from '@/lib/require-admin-page';
import { Users } from 'lucide-react';
import { getUsersWithMemberships } from '@/lib/admin-queries';
import { selectOrganisationUsers } from '@/lib/user-scopes';
import { InviteAdminModal } from './components/invite-admin-modal';
import UserListClient from './UserListClient';

type AdminUsersPageProps = {
  searchParams: Promise<{ verified?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  // 1. Auth guard
  await requireAdminPage();

  // 2. Organisation members only — platform staff live on /system-admins
  const users = selectOrganisationUsers(await getUsersWithMemberships());

  const { verified } = await searchParams;
  const initialVerifiedFilter = verified === 'verified' || verified === 'unverified' ? verified : 'all';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-(--primary)" />
            Organisation Users
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tenant accounts and their per-organisation roles. Platform staff are
            listed under System Admins.
          </p>
        </div>
        <div className="flex items-center">
          <InviteAdminModal />
        </div>
      </div>

      {/* 3. Client-side filter + table */}
      <UserListClient
        users={users}
        showRoleFilter={false}
        initialVerifiedFilter={initialVerifiedFilter}
      />
    </div>
  );
}
