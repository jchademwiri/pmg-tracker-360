'use client';

import { useState, useMemo } from 'react';
import type { TenantStorageUsage } from '@/lib/reports-queries';
import DataTable, { type Column } from '@/components/DataTable';
import { Input } from '@/components/ui/input';
import { Search, Building2, HardDrive, FileText, FolderKanban, Users } from 'lucide-react';

type Props = {
  tenants: TenantStorageUsage[];
};

export function TenantUtilizationTable({ tenants }: Props) {
  const [query, setQuery] = useState('');

  const filteredTenants = useMemo(() => {
    if (!query.trim()) return tenants;
    const q = query.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.slug && t.slug.toLowerCase().includes(q))
    );
  }, [tenants, query]);

  const columns: Column<TenantStorageUsage>[] = [
    {
      key: 'name',
      header: 'Organization',
      render: (t) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-100">{t.name}</span>
            {t.deletedAt && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800/60">
                Archived
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">{t.slug ? `@${t.slug}` : 'No slug'}</span>
        </div>
      ),
    },
    {
      key: 'storage',
      header: 'Storage Used',
      render: (t) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <HardDrive className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-zinc-200 font-medium">{t.storageMB.toLocaleString()} MB</span>
          <span className="text-zinc-500 text-[10px]">({t.documentCount} files)</span>
        </div>
      ),
    },
    {
      key: 'tenders',
      header: 'Tenders',
      render: (t) => (
        <div className="flex items-center gap-1 text-xs text-zinc-300">
          <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>{t.tenderCount}</span>
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      render: (t) => (
        <div className="flex items-center gap-1 text-xs text-zinc-300">
          <FolderKanban className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{t.projectCount}</span>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Members',
      render: (t) => (
        <div className="flex items-center gap-1 text-xs text-zinc-300">
          <Users className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <span>{t.memberCount}</span>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Joined',
      render: (t) => (
        <span className="text-xs text-zinc-500">
          {new Date(t.createdAt).toLocaleDateString('en-GB', {
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
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search tenant by name or slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-zinc-900/60 border-zinc-800 text-xs h-9 placeholder:text-zinc-500"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Showing <span className="font-medium text-zinc-200">{filteredTenants.length}</span> of {tenants.length} tenants
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTenants}
          rowKey={(t) => t.id}
        />
      </div>
    </div>
  );
}
