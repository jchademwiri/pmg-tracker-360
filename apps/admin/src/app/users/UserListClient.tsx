'use client';

import { useState } from 'react';
import type { UserWithMemberships } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

/* =============================================================================
   Exported types and pure filter function (required for Property 10 PBT test)
============================================================================= */

export type UserFilters = {
  planFilter: 'all' | 'free' | 'pro';
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

type Props = {
  users: UserWithMemberships[];
};

export default function UserListClient({ users }: Props) {
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Plan filter */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['all', 'free', 'pro'] as const).map((v) => (
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
      />
    </div>
  );
}
