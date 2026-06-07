'use client';

import { useRouter } from 'next/navigation';
import type { FeedbackWithUser } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

type Props = {
  feedback: FeedbackWithUser[];
  viewMode: string;
};

/* -------------------------------------------------------------------------- */
/*  Column definitions                                                         */
/* -------------------------------------------------------------------------- */

const columns: Column<FeedbackWithUser>[] = [
  {
    key: 'type',
    header: 'Type',
    render: (entry) => <StatusBadge status={entry.type} />,
  },
  {
    key: 'submitter',
    header: 'Submitter',
    render: (entry) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-zinc-200">{entry.name ?? '—'}</span>
        <span className="text-xs text-zinc-500">{entry.email ?? '—'}</span>
      </div>
    ),
  },
  {
    key: 'message',
    header: 'Message',
    render: (entry) => (
      <span className="text-zinc-400 text-sm">
        {entry.message.length > 80
          ? entry.message.slice(0, 80) + '…'
          : entry.message}
      </span>
    ),
    className: 'max-w-xs',
  },
  {
    key: 'url',
    header: 'URL',
    render: (entry) => (
      <span className="text-xs text-zinc-400 truncate max-w-[160px] block">
        {entry.url ?? '—'}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'Linked User',
    render: (entry) => (
      <span className="text-sm text-zinc-400">
        {entry.userName ?? 'Anonymous'}
      </span>
    ),
  },
  {
    key: 'submitted',
    header: 'Submitted',
    render: (entry) => (
      <span className="text-xs text-zinc-500">
        {new Date(entry.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/*  Toggle button                                                               */
/* -------------------------------------------------------------------------- */

type FilterValue = 'all' | 'bug' | 'feature' | 'other';

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Other', value: 'other' },
];

/* -------------------------------------------------------------------------- */
/*  Client component                                                           */
/* -------------------------------------------------------------------------- */

export default function FeedbackListClient({ feedback, viewMode }: Props) {
  const router = useRouter();

  function navigate(value: FilterValue) {
    if (value === 'all') {
      router.push('/feedback');
    } else {
      router.push(`/feedback?type=${value}`);
    }
  }

  // Apply client-side type filter
  const filtered =
    viewMode === 'all'
      ? feedback
      : feedback.filter((entry) => entry.type === viewMode);

  return (
    <div className="space-y-4">
      {/* Filter toggle buttons */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ label, value }) => {
          const isActive = viewMode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => navigate(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(entry) => entry.id}
      />
    </div>
  );
}
