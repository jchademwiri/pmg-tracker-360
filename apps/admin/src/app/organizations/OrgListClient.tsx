'use client';

import { useState } from 'react';
import DataTable, { type Column } from '@/components/DataTable';
import OrgDrawer from '@/components/OrgDrawer';
import StatusBadge from '@/components/StatusBadge';
import type { OrgWithCounts } from '@/lib/admin-queries';
import ConfirmDialog from '@/components/ConfirmDialog';
import { bulkSuspendOrgs, bulkRestoreOrgs, bulkPurgeOrgs } from './actions';
import { useRouter } from 'next/navigation';
import { CheckSquare, ShieldAlert, RotateCcw, Trash2, X } from 'lucide-react';

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
        <span className={imminent ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
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
  const router = useRouter();
  const [filter, setFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set());

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

  // Bulk actions handlers
  async function handleBulkSuspend() {
    const ids = Array.from(selectedOrgIds);
    setActionLoading(true);
    await bulkSuspendOrgs(ids);
    setActionLoading(false);
    setSelectedOrgIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  async function handleBulkRestore() {
    const ids = Array.from(selectedOrgIds);
    setActionLoading(true);
    await bulkRestoreOrgs(ids);
    setActionLoading(false);
    setSelectedOrgIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  async function handleBulkPurge() {
    const ids = Array.from(selectedOrgIds);
    setActionLoading(true);
    await bulkPurgeOrgs(ids);
    setActionLoading(false);
    setSelectedOrgIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedOrgIds.size > 0 && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>{selectedOrgIds.size} organisation(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Bulk Suspend Organisations',
                  description: `Soft-delete and schedule 72h permanent deletion for ${selectedOrgIds.size} selected organisation(s)?`,
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
                  title: 'Bulk Restore Organisations',
                  description: `Re-activate ${selectedOrgIds.size} selected organisation(s) and cancel scheduled deletion?`,
                  confirmText: 'Restore Selected',
                  variant: 'info',
                  action: handleBulkRestore,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-xs font-semibold text-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </button>

            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Bulk Purge Organisations',
                  description: `PERMANENTLY delete ${selectedOrgIds.size} selected organisation(s) and all their memberships? This action cannot be undone.`,
                  confirmText: 'Purge Selected',
                  variant: 'danger',
                  requireValue: 'PURGE',
                  action: handleBulkPurge,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950 border border-red-800 hover:bg-red-900 text-xs font-semibold text-red-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Purge Selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedOrgIds(new Set())}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
        selectable={true}
        selectedKeys={selectedOrgIds}
        onSelectionChange={setSelectedOrgIds}
      />

      {/* Org detail drawer */}
      {selectedOrgId !== null && (
        <OrgDrawer
          orgId={selectedOrgId}
          onClose={() => setSelectedOrgId(null)}
        />
      )}

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
