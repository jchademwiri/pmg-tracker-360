'use client';

import { useState } from 'react';
import DataTable, { type Column } from '@/components/DataTable';
import OrgDrawer from '@/components/OrgDrawer';
import StatusBadge from '@/components/StatusBadge';
import type { OrgWithCounts } from '@/lib/admin-queries';

/* ─── Pure helper — exported for Property 15 PBT test ──────────────────── */

export function isPurgeImminent(purgeDate: Date | null, now: Date): boolean {
  if (!purgeDate) return false;
  return (purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ─── Table columns ─────────────────────────────────────────────────────── */

const columns: Column<OrgWithCounts>[] = [
  {
    key: 'name',
    header: 'Organisation',
    render: (org) => (
      <div>
        <div className="font-medium text-white">{org.name}</div>
        <div className="text-xs text-zinc-500 font-mono mt-0.5">
          {org.id.slice(0, 8)}
        </div>
      </div>
    ),
  },
  {
    key: 'slug',
    header: 'Slug',
    render: (org) => (
      <span className="text-zinc-300">{org.slug ?? '—'}</span>
    ),
  },
  {
    key: 'members',
    header: 'Members',
    render: (org) => (
      <span className="tabular-nums">{org.memberCount}</span>
    ),
  },
  {
    key: 'tenders',
    header: 'Tenders',
    render: (org) => (
      <span className="tabular-nums">{org.tenderCount}</span>
    ),
  },
  {
    key: 'projects',
    header: 'Projects',
    render: (org) => (
      <span className="tabular-nums">{org.projectCount}</span>
    ),
  },
  {
    key: 'pos',
    header: 'POs',
    render: (org) => (
      <span className="tabular-nums">{org.poCount}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (org) => (
      <StatusBadge status={org.deletedAt ? 'deleted' : 'active'} />
    ),
  },
  {
    key: 'purgeDate',
    header: 'Purge Date',
    render: (org) => {
      const imminent = isPurgeImminent(org.permanentDeletionScheduledAt, new Date());
      return (
        <span className={imminent ? 'text-red-400' : 'text-zinc-400'}>
          {formatDate(org.permanentDeletionScheduledAt)}
        </span>
      );
    },
  },
  {
    key: 'created',
    header: 'Created',
    render: (org) => (
      <span className="text-zinc-400">{formatDate(org.createdAt)}</span>
    ),
  },
];

/* ─── Props ─────────────────────────────────────────────────────────────── */

type OrgListClientProps = {
  orgs: OrgWithCounts[];
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function OrgListClient({ orgs }: OrgListClientProps) {
  const [filter, setFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const filtered = orgs
    .filter((o) =>
      filter === 'active'
        ? o.deletedAt === null
        : filter === 'deleted'
        ? o.deletedAt !== null
        : true
    )
    .filter((o) =>
      search.trim() === ''
        ? true
        : o.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
          {(
            [
              { value: 'active', label: 'Active Only' },
              { value: 'deleted', label: 'Deleted' },
              { value: 'all', label: 'All' },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === value
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedOrgId(row.id)}
      />

      {/* Org detail drawer */}
      {selectedOrgId !== null && (
        <OrgDrawer
          orgId={selectedOrgId}
          onClose={() => setSelectedOrgId(null)}
        />
      )}
    </div>
  );
}
