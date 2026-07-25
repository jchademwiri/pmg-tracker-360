'use client';

import { useState } from 'react';
import type { UserWithMemberships } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

/* =============================================================================
   Exported types and pure filter function (required for Property 10 PBT test)
============================================================================= */

export type UserFilters = {
  planFilter: 'all' | 'free' | 'starter' | 'pro';
  roleFilter: 'all' | 'user' | 'admin';
  verifiedFilter: 'all' | 'verified' | 'unverified';
  search: string;
};

export function applyUserFilters(
  users: UserWithMemberships[],
  filters: UserFilters,
): UserWithMemberships[] {
  return users
    .filter(u => filters.planFilter === 'all' || u.plan === filters.planFilter)
    .filter(u => filters.roleFilter === 'all' || u.role === filters.roleFilter)
    .filter(u =>
      filters.verifiedFilter === 'all' ? true :
      filters.verifiedFilter === 'verified' ? u.emailVerified :
      !u.emailVerified,
    )
    .filter(u =>
      filters.search.trim() === '' ? true :
      u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      u.email.toLowerCase().includes(filters.search.toLowerCase()),
    );
}

/* =============================================================================
   Component
============================================================================= */

import UserDrawer from '@/components/UserDrawer';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  bulkUpdateUserRole,
  bulkUpdateUserPlan,
  bulkToggleUserSuspension,
  bulkDeleteUserAccounts,
} from './actions';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Trash2, User, Zap, CheckSquare, X, Crown } from 'lucide-react';

type Props = {
  users: UserWithMemberships[];
};

export default function UserListClient({ users }: Props) {
  const router = useRouter();
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'starter' | 'pro'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    requireValue?: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    variant: 'danger',
    action: async () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = applyUserFilters(users, { planFilter, roleFilter, verifiedFilter, search });

  const columns: Column<UserWithMemberships>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div>
          <div className="font-medium text-white">{u.name}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      render: (u) => (
        <StatusBadge status={u.emailVerified ? 'active' : 'deleted'} />
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (u) => <StatusBadge status={u.plan} />,
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: 'orgs',
      header: 'Organisations',
      render: (u) => {
        if (u.isGhost) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-zinc-800/60 text-zinc-400 border-zinc-700/40">
              Ghost Account
            </span>
          );
        }
        if (u.memberships.length === 0) {
          return <span className="text-zinc-600 text-xs italic">No organisations</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {u.memberships.map((m) => (
              <span
                key={`${m.orgId}-${m.role}`}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-zinc-800/60 text-zinc-400 border-zinc-700/40"
              >
                {m.orgName}:{m.role}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'lastOrg',
      header: 'Last Active Org',
      render: (u) => (
        <span className="text-zinc-400 text-sm">{u.lastActiveOrgName ?? '—'}</span>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (u) => (
        <span className="text-zinc-400 text-sm">
          {u.providerId === 'credential' ? 'Password' : u.providerId ?? '—'}
        </span>
      ),
    },
    {
      key: 'registered',
      header: 'Registered',
      render: (u) => (
        <span className="text-zinc-400 text-xs">
          {new Date(u.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  // Bulk actions handlers
  async function handleBulkRole(newRole: 'user' | 'admin') {
    const ids = Array.from(selectedUserIds);
    setActionLoading(true);
    await bulkUpdateUserRole(ids, newRole);
    setActionLoading(false);
    setSelectedUserIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  async function handleBulkPlan(newPlan: 'free' | 'starter' | 'pro') {
    const ids = Array.from(selectedUserIds);
    setActionLoading(true);
    await bulkUpdateUserPlan(ids, newPlan);
    setActionLoading(false);
    setSelectedUserIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  async function handleBulkSuspend() {
    const ids = Array.from(selectedUserIds);
    setActionLoading(true);
    await bulkToggleUserSuspension(ids, true);
    setActionLoading(false);
    setSelectedUserIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedUserIds);
    setActionLoading(true);
    await bulkDeleteUserAccounts(ids);
    setActionLoading(false);
    setSelectedUserIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Selection Action Toolbar */}
      {selectedUserIds.size > 0 && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>{selectedUserIds.size} user(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Bulk Update User Roles',
                  description: `Are you sure you want to promote ${selectedUserIds.size} selected user(s) to System Administrators?`,
                  confirmText: 'Make Admin',
                  variant: 'info',
                  action: () => handleBulkRole('admin'),
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              Make Admin
            </button>

            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Bulk Upgrade User Plans',
                  description: `Upgrade ${selectedUserIds.size} selected user(s) to PRO plan?`,
                  confirmText: 'Upgrade to PRO',
                  variant: 'info',
                  action: () => handleBulkPlan('pro'),
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold text-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Upgrade to PRO
            </button>

            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Bulk Suspend User Accounts',
                  description: `Revoke all active sessions and suspend ${selectedUserIds.size} selected user(s)?`,
                  confirmText: 'Suspend Selected',
                  variant: 'warning',
                  action: handleBulkSuspend,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950 border border-amber-800 hover:bg-amber-900 text-xs font-semibold text-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Suspend
            </button>

            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Bulk Delete User Accounts',
                  description: `Permanently delete ${selectedUserIds.size} selected user account(s)? This action cannot be reversed.`,
                  confirmText: 'Delete Selected Users',
                  variant: 'danger',
                  requireValue: 'DELETE',
                  action: handleBulkDelete,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-800 hover:bg-red-900 text-xs font-semibold text-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedUserIds(new Set())}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Plan filter */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['all', 'free', 'starter', 'pro'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPlanFilter(v)}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors capitalize ${
                planFilter === v
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v === 'all' ? 'All Plans' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['all', 'user', 'admin'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRoleFilter(v)}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors capitalize ${
                roleFilter === v
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v === 'all' ? 'All Roles' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Verified filter */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['all', 'verified', 'unverified'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerifiedFilter(v)}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
                verifiedFilter === v
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />

        {/* Result count */}
        <span className="text-xs text-zinc-500 whitespace-nowrap">
          {filtered.length} of {users.length} users
        </span>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        onRowClick={(u) => setSelectedUserId(u.id)}
        selectable={true}
        selectedKeys={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
      />

      {/* User Drawer */}
      <UserDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        variant={dialogState.variant}
        requireConfirmationValue={dialogState.requireValue}
        loading={actionLoading}
        onConfirm={() => dialogState.action()}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
