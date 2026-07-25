'use client';

import { useState } from 'react';
import type { TicketWithUser } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import TicketStatusSelect from './TicketStatusSelect';
import ConfirmDialog from '@/components/ConfirmDialog';
import { bulkUpdateTicketStatus, bulkDeleteTickets } from './actions';
import { useRouter } from 'next/navigation';
import { CheckSquare, Clock, CheckCircle2, Trash2, X } from 'lucide-react';

const columns: Column<TicketWithUser>[] = [
  {
    key: 'ref',
    header: 'Ticket',
    render: (t) => (
      <span className="font-mono text-xs text-zinc-300">
        #{t.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'submitter',
    header: 'Submitter',
    render: (t) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-zinc-200">{t.name}</span>
        <span className="text-xs text-zinc-500">{t.email}</span>
      </div>
    ),
  },
  {
    key: 'message',
    header: 'Message',
    render: (t) => (
      <span className="text-zinc-400 text-sm">
        {t.message.length > 80 ? t.message.slice(0, 80) + '…' : t.message}
      </span>
    ),
    className: 'max-w-xs',
  },
  {
    key: 'status',
    header: 'Status',
    render: (t) => <StatusBadge status={t.status} />,
  },
  {
    key: 'user',
    header: 'Linked User',
    render: (t) => (
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-zinc-300 font-medium">
          {t.userName ?? 'Anonymous'}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
          Verified User
        </span>
      </div>
    ),
  },
  {
    key: 'submitted',
    header: 'Submitted',
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
  {
    key: 'actions',
    header: 'Actions',
    render: (t) => (
      <TicketStatusSelect ticketId={t.id} currentStatus={t.status} />
    ),
  },
];

type Props = {
  tickets: TicketWithUser[];
};

export default function TicketsListClient({ tickets }: Props) {
  const router = useRouter();
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

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

  async function handleBulkStatus(status: 'in_progress' | 'closed') {
    const ids = Array.from(selectedTicketIds);
    setActionLoading(true);
    await bulkUpdateTicketStatus(ids, status);
    setActionLoading(false);
    setSelectedTicketIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedTicketIds);
    setActionLoading(true);
    await bulkDeleteTickets(ids);
    setActionLoading(false);
    setSelectedTicketIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Floating Selection Toolbar */}
      {selectedTicketIds.size > 0 && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>{selectedTicketIds.size} ticket(s) selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Mark Tickets as In Progress',
                  description: `Change status of ${selectedTicketIds.size} selected ticket(s) to "In Progress"?`,
                  confirmText: 'Mark In Progress',
                  variant: 'info',
                  action: () => handleBulkStatus('in_progress'),
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-950 border border-blue-800 hover:bg-blue-900 text-xs font-semibold text-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              In Progress
            </button>

            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Close Selected Tickets',
                  description: `Change status of ${selectedTicketIds.size} selected ticket(s) to "Closed"?`,
                  confirmText: 'Mark Closed',
                  variant: 'info',
                  action: () => handleBulkStatus('closed'),
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-xs font-semibold text-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Closed
            </button>

            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: 'Delete Selected Tickets',
                  description: `Permanently delete ${selectedTicketIds.size} selected support ticket(s)? This action cannot be reversed.`,
                  confirmText: 'Delete Selected Tickets',
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
              onClick={() => setSelectedTicketIds(new Set())}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tickets}
        rowKey={(ticket) => ticket.id}
        selectable={true}
        selectedKeys={selectedTicketIds}
        onSelectionChange={setSelectedTicketIds}
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
