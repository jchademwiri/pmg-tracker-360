'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, X, CheckSquare, Send, Loader } from 'lucide-react';
import type { UserWithMemberships } from '@/lib/admin-queries';
import { organisationRoles } from '@/lib/user-scopes';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import UserDrawer from '@/components/UserDrawer';
import ConfirmDialog from '@/components/ConfirmDialog';
import { bulkUpdateUserRole } from '../users/actions';
import { resendAdminInvitation } from '../actions';

/**
 * Pure search filter — exported for unit testing.
 */
export function applyAdminSearch(
  admins: UserWithMemberships[],
  search: string
): UserWithMemberships[] {
  const term = search.trim().toLowerCase();
  if (term === '') return admins;
  return admins.filter(
    (a) =>
      a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term)
  );
}

type Props = {
  admins: UserWithMemberships[];
  /** Excluded from revoke selection — an admin cannot demote themselves. */
  currentUserId: string;
};

export default function SystemAdminListClient({ admins, currentUserId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const filtered = applyAdminSearch(admins, search);

  // The server action also refuses self-demotion; mirroring it here keeps the
  // count in the dialog honest.
  const revocableIds = Array.from(selectedUserIds).filter(
    (id) => id !== currentUserId
  );

  const columns: Column<UserWithMemberships>[] = [
    {
      key: 'user',
      header: 'Admin',
      render: (u) => (
        <div>
          <div className="font-medium text-white">
            {u.name}
            {u.id === currentUserId && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                You
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'systemRole',
      header: 'System Role',
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: 'verified',
      header: 'Verified',
      render: (u) => (
        <StatusBadge status={u.emailVerified ? 'verified' : 'unverified'} />
      ),
    },
    {
      key: 'orgs',
      header: 'Organisation Roles',
      render: (u) => {
        const memberships = organisationRoles(u);
        if (memberships.length === 0) {
          return (
            <span className="text-zinc-600 text-xs italic">
              Platform only
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {memberships.map((m) => (
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
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <button
          type="button"
          disabled={resendingId !== null}
          // The row itself opens the detail drawer.
          onClick={(e) => {
            e.stopPropagation();
            handleResendInvite(u);
          }}
          title={`Resend the invitation email to ${u.email}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold text-zinc-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          {resendingId === u.id ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Resend invite
        </button>
      ),
    },
  ];

  async function handleResendInvite(u: UserWithMemberships) {
    setResendingId(u.id);
    setResendResult(null);
    const res = await resendAdminInvitation(u.email);
    setResendingId(null);
    setResendResult({
      ok: res.success,
      message: res.success ? res.message : res.error,
    });
  }

  async function handleRevokeAdmin() {
    setActionLoading(true);
    await bulkUpdateUserRole(revocableIds, 'user');
    setActionLoading(false);
    setSelectedUserIds(new Set());
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {resendResult && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
            resendResult.ok
              ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
              : 'bg-red-950/40 border-red-900/60 text-red-200'
          }`}
        >
          <span>{resendResult.message}</span>
          <button
            type="button"
            onClick={() => setResendResult(null)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Selection Action Toolbar */}
      {selectedUserIds.size > 0 && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>{selectedUserIds.size} admin(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={revocableIds.length === 0}
              onClick={() => setConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950 border border-amber-800 hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke Admin
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
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />

        <span className="text-xs text-zinc-500 whitespace-nowrap">
          {filtered.length} of {admins.length} system admins
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

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Revoke System Admin Access"
        description={`Demote ${revocableIds.length} admin(s) to a standard user? They will lose access to this console. Organisation roles are unaffected.`}
        confirmText="Revoke Admin"
        variant="warning"
        loading={actionLoading}
        onConfirm={handleRevokeAdmin}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
