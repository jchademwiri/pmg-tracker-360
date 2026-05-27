import React from 'react';

// ----------------------------------------------------------------------
// PAGE: Admin Dashboard Overview
// PATH: /admin
// ----------------------------------------------------------------------

export default function AdminDashboardPage() {
  /**
   * TODO: DASHBOARD OVERVIEW IMPLEMENTATION
   *
   * 1. KPIs (Key Performance Indicators)
   *    - Fetch total number of "Users" from database.
   *    - Fetch total number of "Organizations" (active vs deleted).
   *    - Fetch total number of "Tenders" (shows platform usage/value).
   *    - System Health Status (Mock or Real: e.g., Database connection ok, Email service ok).
   *
   * 2. DATA VISUALIZATION
   *    - Optional: Add a chart showing "User Growth" over the last 30 days.
   *    - Optional: Add a chart showing "New Organizations" per month.
   *
   * 3. ACTIVITY STREAM (Audit Logs)
   *    - Display the last 5-10 entries from `securityAuditLog` table.
   *    - Columns: Action (e.g., "User Login"), Actor (User Name), Time, Status.
   *
   * 4. QUICK ACTIONS
   *    - "Invite Admin" button.
   *    - "View Critical Alerts" (if any).
   */

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          System overview and health status.
        </p>
      </div>

      {/* Placeholder for KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Total Users
          </div>
          <div className="text-2xl font-bold mt-2">--</div>
          <div className="text-xs text-muted-foreground mt-1">
            Waitlist & Active
          </div>
        </div>
        <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Active Orgs
          </div>
          <div className="text-2xl font-bold mt-2">--</div>
          <div className="text-xs text-muted-foreground mt-1">
            Organizations on platform
          </div>
        </div>
        <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Total Tenders
          </div>
          <div className="text-2xl font-bold mt-2">--</div>
          <div className="text-xs text-muted-foreground mt-1">
            Across all orgs
          </div>
        </div>
        <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            System Health
          </div>
          <div className="text-2xl font-bold mt-2 text-green-600">
            Operational
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            All systems nominal
          </div>
        </div>
      </div>

      {/* Placeholder for Recent Activity */}
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Recent System Activity</h3>
        <div className="text-sm text-muted-foreground italic border-t pt-4">
          Audit logs will verify user actions, logins, and critical system
          events. (Coming Soon: Connect to `securityAuditLog` table)
        </div>
        {/* <RecentActivityTable /> */}
      </div>
    </div>
  );
}
