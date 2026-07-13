import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFeedback } from '@/lib/admin-queries';
import FeedbackListClient from './FeedbackListClient';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; page?: string }>;
}) {
  // 1. Auth guard
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') redirect('/login');

  // 2. Read type filter from URL
  const params = await searchParams;
  const typeFilter = params?.type; // undefined = all
  const viewMode = typeFilter ?? 'all';

  // 3. Fetch (server always fetches all; client-side filter applied in FeedbackListClient)
  const feedbackItems = await getFeedback();

  // 4. Render
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Feedback</h1>
        <p className="text-sm text-zinc-400">
          User-submitted bug reports, feature requests, and general feedback.
        </p>
      </div>
      <FeedbackListClient feedback={feedbackItems} viewMode={viewMode} />
    </div>
  );
}
