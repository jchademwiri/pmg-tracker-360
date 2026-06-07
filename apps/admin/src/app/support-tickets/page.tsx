import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOpenTickets, type TicketWithUser } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import TicketStatusSelect from './TicketStatusSelect';

/* -------------------------------------------------------------------------- */
/*  Column definitions                                                         */
/* -------------------------------------------------------------------------- */

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
      <span className="text-sm text-zinc-400">
        {t.userName ?? 'Anonymous'}
      </span>
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

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function SupportTicketsPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Data fetching — getOpenTickets returns all tickets ordered by createdAt DESC
  const tickets = await getOpenTickets();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Support Tickets
        </h1>
        <p className="text-sm text-zinc-400">
          Manage and progress open support requests from platform users.
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={tickets}
        rowKey={(ticket) => ticket.id}
      />
    </div>
  );
}
