import React from 'react';
import { Button } from '@/components/ui/button';

// ----------------------------------------------------------------------
// PAGE: User Management
// PATH: /admin/users
// ----------------------------------------------------------------------

export default function AdminUsersPage() {
  /**
   * TODO: USER MANAGEMENT IMPLEMENTATION
   *
   * 1. DATA TABLE
   *    - Fetch all users from `user` table.
   *    - Support server-side pagination (limit to 10/20 per page) if large dataset.
   *    - Columns:
   *      - Avatar + Name (Composite).
   *      - Email.
   *      - Role (Badge: User vs Superadmin).
   *      - Verified (Email Verified Status).
   *      - Joined Date (formatted).
   *      - Last Active (from `sessionTracking` or `session` table).
   *
   * 2. FILTERS & SEARCH
   *    - Search bar for Name/Email.
   *    - Filter by Role (Admin/User).
   *
   * 3. ACTIONS (Row Level)
   *    - "Edit Role": Allow promoting a user to 'superadmin' or demoting.
   *    - "Impersonate": (Advanced) Create a session as this user to debug specific issues.
   *    - "Ban/Deactivate": Soft delete or flag the user.
   *
   * 4. HEADER ACTIONS
   *    - "Invite User": Manually create a user/admin?
   */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            View, search, and manage platform users.
          </p>
        </div>
        <Button variant="default" size="default">
          Export Users
        </Button>
      </div>

      {/* Placeholder for User Table */}
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm min-h-[400px] flex items-center justify-center text-muted-foreground">
        <div className="text-center p-8">
          <p className="mb-2 font-medium">User Table Component Placeholder</p>
          <p className="text-sm max-w-md mx-auto">
            This table should list all users with columns for Name, Email, Role,
            and Status. Include actions to promote/demote admins and view user
            details.
          </p>
        </div>
      </div>
    </div>
  );
}
