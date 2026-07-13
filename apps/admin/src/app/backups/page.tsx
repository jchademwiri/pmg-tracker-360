import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@pmg/db';
import { user } from '@pmg/db/schema';
import { count, eq } from 'drizzle-orm';
import BackupsClient from './BackupsClient';

export default async function BackupsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).role !== 'admin') {
    const adminCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, 'admin'));
    const adminCount = adminCountResult[0]?.count ?? 0;
    if (adminCount === 0) {
      redirect('/setup');
    }
    redirect('/login');
  }

  return <BackupsClient />;
}
