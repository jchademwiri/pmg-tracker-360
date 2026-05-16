import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth'; // Adjust import based on your actual auth setup
import { headers } from 'next/headers';
import Logout from '@/components/ui/logout';
import AdminLayoutClient from '@/components/admin/admin-layout-client';

// Placeholder for Admin Sidebar and Header components
// You should create these components in src/components/admin/
// import { AdminSidebar } from '@/components/admin/admin-sidebar';
// import { AdminHeader } from '@/components/admin/admin-header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  // ----------------------------------------------------------------------
  // AUTH CHECK: Ensure user is logged in and has 'admin' role (or 'superadmin')
  // ----------------------------------------------------------------------
  // NOTE: The role check depends on how you implemented the 'role' field.
  // If 'role' is directly on user, check user.role.
  // If we need to fetch it from DB, do it here.

  // ----------------------------------------------------------------------
  // AUTH CHECK: Ensure user is logged in and has 'admin' role (or 'superadmin')
  // ----------------------------------------------------------------------

  // For now, if no user, redirect to login
  if (!user) {
    return redirect('/login');
  }

  // Strictly enforce 'admin' role
  // We use a safe check assuming user might have a role property attached,
  // or purely relying on the session data we trust.
  const userRole = (user as any).role;

  if (userRole !== 'admin') {
    // If not admin, log warning via console (auditLogger requires DB write,
    // we can keep it simple here or add audit logging if really needed but
    // console.warn is sufficient for now as per instructions "console.log -> app's logging service OR similar")
    console.warn(
      `[SECURITY] Unauthorized access attempt to Admin Portal by user: ${user.email} (ID: ${user.id})`
    );

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    return redirect(`${baseUrl}/dashboard`);
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
