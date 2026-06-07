import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAllActiveSessions, getSuspiciousSessions } from '@/lib/admin-queries';
import SessionsListClient from './SessionsListClient';

export default async function SessionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; page?: string }>;
}) {
  // 1. Auth guard
  const session = await auth.api.getSession({ headers: await headers() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).role !== 'admin') redirect('/login');

  // 2. Read view param
  const params = await searchParams;
  const showAll = params?.view === 'all';
  const viewMode: 'suspicious' | 'all' = showAll ? 'all' : 'suspicious';

  // 3. Fetch — one query only, determined by viewMode
  const sessions = showAll
    ? await getAllActiveSessions()
    : await getSuspiciousSessions();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Sessions</h1>
        <p className="text-sm text-zinc-400">Monitor active sessions and revoke suspicious ones.</p>
      </div>
      <SessionsListClient sessions={sessions} viewMode={viewMode} />
    </div>
  );
}
