import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOpenTickets } from '@/lib/admin-queries';
import TicketsListClient from './TicketsListClient';

export default async function SupportTicketsPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Data fetching — getOpenTickets returns all tickets ordered by createdAt DESC
  const tickets = await getOpenTickets();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Support Tickets
        </h1>
        <p className="text-sm text-zinc-400">
          Manage and progress open support requests from platform users.
        </p>
      </div>

      {/* Client component owns all column definitions and DataTable rendering */}
      <TicketsListClient tickets={tickets} />
    </div>
  );
}
