import React from 'react';
import { db } from '@pmg/db';
import { user } from '@pmg/db/schema';
import { count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import SetupForm from './SetupForm';

export default async function InitialSetupPage() {
  // Check if any administrators already exist in the system
  const adminCountResult = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, 'admin'));

  const adminCount = adminCountResult[0]?.count ?? 0;

  // Security Hardening: If an admin already exists, block access and redirect to login
  if (adminCount > 0) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <SetupForm />
    </div>
  );
}
