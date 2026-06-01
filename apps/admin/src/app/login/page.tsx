import React from 'react';
import { db } from '@pmg/db';
import { user } from '@pmg/db/schema';
import { count, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

const TRACKER_APP_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://tendertrack360.co.za'
    : 'http://localhost:3000');

export default async function AdminLoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session.user as any).role === 'admin') {
      redirect('/');
    }

    redirect(new URL('/dashboard', TRACKER_APP_URL).toString());
  }

  // If no administrators exist in the database, redirect to initial setup
  const adminCountResult = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, 'admin'));

  const adminCount = adminCountResult[0]?.count ?? 0;
  if (adminCount === 0) {
    redirect('/setup');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <LoginForm />
    </div>
  );
}
