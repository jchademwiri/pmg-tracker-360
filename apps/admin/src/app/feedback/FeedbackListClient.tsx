'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FeedbackWithUser } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { FeedbackDetailDrawer } from './FeedbackDetailDrawer';
import {
  MessageSquare,
  Search,
  ExternalLink,
  ChevronRight,
  Mail,
  Send,
  User,
} from 'lucide-react';

type Props = {
  feedback: FeedbackWithUser[];
  viewMode: string;
};

type FilterValue = 'all' | 'bug' | 'feature' | 'other';

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All Feedback', value: 'all' },
  { label: 'Bug Reports', value: 'bug' },
  { label: 'Feature Requests', value: 'feature' },
  { label: 'General Feedback', value: 'other' },
];

export default function FeedbackListClient({ feedback, viewMode }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function navigate(value: FilterValue) {
    if (value === 'all') {
      router.push('/feedback');
    } else {
      router.push(`/feedback?type=${value}`);
    }
  }

  const handleOpenFeedback = (entry: FeedbackWithUser) => {
    setSelectedFeedback(entry);
    setDrawerOpen(true);
  };

  // 1. Filter by type
  const typeFiltered =
    viewMode === 'all'
      ? feedback
      : feedback.filter((entry) => entry.type === viewMode);

  // 2. Filter by search query
  const filtered = typeFiltered.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.message.toLowerCase().includes(q) ||
      (entry.name && entry.name.toLowerCase().includes(q)) ||
      (entry.email && entry.email.toLowerCase().includes(q)) ||
      (entry.url && entry.url.toLowerCase().includes(q)) ||
      (entry.userName && entry.userName.toLowerCase().includes(q))
    );
  });

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
          <span className="font-semibold text-zinc-200">
            {entry.name || entry.userName || 'Anonymous'}
          </span>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {entry.email ?? 'No email'}
          </span>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Feedback Summary',
      render: (entry) => (
        <span className="text-zinc-300 text-sm line-clamp-2 leading-relaxed">
          {entry.message}
        </span>
      ),
      className: 'max-w-md',
    },
    {
      key: 'url',
      header: 'Source Page',
      render: (entry) =>
        entry.url ? (
          <span className="text-xs text-indigo-400 truncate max-w-[140px] block" title={entry.url}>
            {entry.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
          </span>
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        ),
    },
    {
      key: 'submitted',
      header: 'Received',
      render: (entry) => (
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          {new Date(entry.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (entry) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenFeedback(entry);
          }}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
        >
          <span>View & Reply</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar: Type Tabs & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter toggle buttons */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ label, value }) => {
            const isActive = viewMode === value;
            const count =
              value === 'all'
                ? feedback.length
                : feedback.filter((e) => e.type === value).length;

            return (
              <button
                key={value}
                type="button"
                onClick={() => navigate(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-600 border-amber-500 text-white font-semibold shadow-xs'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback message, user, email..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(entry) => entry.id}
          onRowClick={(entry) => handleOpenFeedback(entry)}
        />
      </div>

      {/* Detail & Reply Drawer */}
      <FeedbackDetailDrawer
        feedback={selectedFeedback}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
