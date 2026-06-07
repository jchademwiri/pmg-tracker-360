'use client';

import { useTransition, useState } from 'react';
import { updateTicketStatus } from './actions';

type Props = {
  ticketId: string;
  currentStatus: string;
};

// Shows only the next valid transition:
// open → button to mark "in_progress"
// in_progress → button to mark "closed"
// closed → text only (no button)
export default function TicketStatusSelect({ ticketId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextStatus =
    currentStatus === 'open'
      ? 'in_progress'
      : currentStatus === 'in_progress'
        ? 'closed'
        : null;

  if (!nextStatus) {
    return <span className="text-xs text-zinc-500">Closed</span>;
  }

  const label = nextStatus === 'in_progress' ? 'Mark In Progress' : 'Mark Closed';

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await updateTicketStatus(ticketId, nextStatus!);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update');
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {isPending ? 'Updating…' : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
