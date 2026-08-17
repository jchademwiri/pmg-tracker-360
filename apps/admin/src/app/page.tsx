import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@pmg/db";
import { user } from "@pmg/db/schema";
import { count, eq } from "drizzle-orm";
import {
  Users,
  Building2,
  FileText,
  FolderOpen,
  Activity,
  ShieldCheck,
  LifeBuoy,
  Users2,
  LogOut,
} from "lucide-react";
import { adminSignOut } from "@/app/actions";
import AlertTray from "@/components/AlertTray";
import MetricCard from "@/components/MetricCard";
import {
  getDashboardMetrics,
  getAlertCounts,
  getRecentActivity,
  getSuspiciousSessions,
} from "@/lib/admin-queries";

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import RevenueAnalytics from "@/components/dashboard/RevenueAnalytics";
import SystemHealthWidget from "@/components/dashboard/SystemHealthWidget";
import SecurityLogStream from "@/components/dashboard/SecurityLogStream";

export default async function AdminDashboardPage() {
  // 1. Auth guard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "admin") {
    const adminCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"));
    const adminCount = adminCountResult[0]?.count ?? 0;
    if (adminCount === 0) {
      redirect("/setup");
    }
    redirect("/login");
  }

  if ((session.user as any).mustSetPassword) {
    redirect("/set-password");
  }

  // 2. Data fetching
  const [metrics, alertCounts, recentActivity, suspiciousSessions] =
    await Promise.all([
      getDashboardMetrics(),
      getAlertCounts(),
      getRecentActivity(25),
      getSuspiciousSessions(),
    ]);

  // 3. Derived values
  const verifiedPct = Math.round(
    (metrics.verifiedCount / Math.max(metrics.totalUsers, 1)) * 100,
  );

  const totalTenders = metrics.totalTenders;

  // Alert definitions
  const alerts = [
    {
      id: "suspicious",
      label: `${alertCounts.suspiciousSessions} suspicious active session(s)`,
      count: alertCounts.suspiciousSessions,
      severity: "critical" as const,
      href: "/sessions",
    },
    {
      id: "unverified",
      label: `${alertCounts.unverifiedRecentUsers} unverified user(s) registered in the last 7 days`,
      count: alertCounts.unverifiedRecentUsers,
      severity: "high" as const,
      href: "/users",
    },
    {
      id: "purge",
      label: `${alertCounts.pendingPurgeOrgs} organisation(s) scheduled for deletion within 72 hours`,
      count: alertCounts.pendingPurgeOrgs,
      severity: "high" as const,
      href: "/organizations",
    },
    {
      id: "invitations",
      label: `${alertCounts.expiringInvitations} invitation(s) expiring within 48 hours`,
      count: alertCounts.expiringInvitations,
      severity: "medium" as const,
      href: "/organizations",
    },
    {
      id: "transfers",
      label: `${alertCounts.expiringTransfers} ownership transfer(s) expiring within 24 hours`,
      count: alertCounts.expiringTransfers,
      severity: "medium" as const,
      href: "/",
    },
    {
      id: "tickets",
      label: `${alertCounts.openTickets} open support ticket(s)`,
      count: alertCounts.openTickets,
      severity: "low" as const,
      href: "/support-tickets",
    },
  ];

  // Pipeline bar helper
  const pipelineStatuses: Array<{
    key: "draft" | "submitted" | "won" | "lost" | "pending";
    label: string;
    color: string;
  }> = [
    { key: "draft", label: "Draft", color: "bg-zinc-500" },
    { key: "submitted", label: "Submitted", color: "bg-indigo-500" },
    { key: "won", label: "Won", color: "bg-emerald-500" },
    { key: "lost", label: "Lost", color: "bg-red-500" },
    { key: "pending", label: "Pending", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-8">
      {/* ------------------------------------------------------------------ */}
      {/* a. Page header                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Platform Overview
          </h1>
          <p className="text-sm text-zinc-400">
            Real-time platform health, revenue metrics, security audit stream,
            and administrative controls.
          </p>
        </div>
        <form action={adminSignOut}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer text-zinc-300"
          >
            <LogOut className="h-4 w-4" />
            End Session
          </button>
        </form>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <QuickActionsBar />

      {/* Alert tray */}
      <AlertTray alerts={alerts} />

      {/* KPI grid — 8 cards, 4-col */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Users"
          count={metrics.totalUsers}
          icon={<Users className="h-5 w-5 text-indigo-400" />}
          variant="primary"
          secondaryNote={`+${metrics.newUsersThisWeek} this week`}
        />
        <MetricCard
          label="Active Orgs"
          count={metrics.activeOrgs}
          icon={<Building2 className="h-5 w-5 text-emerald-400" />}
          variant="success"
          secondaryNote={`+${metrics.newOrgsThisWeek} this week`}
        />
        <MetricCard
          label="Tenders Tracked"
          count={metrics.totalTenders}
          icon={<FileText className="h-5 w-5 text-amber-400" />}
          variant="warning"
          secondaryNote="See pipeline below"
        />
        <MetricCard
          label="Active Projects"
          count={metrics.activeProjects}
          icon={<FolderOpen className="h-5 w-5 text-emerald-400" />}
          variant="success"
          secondaryNote="Active only"
        />
        <MetricCard
          label="Live Sessions"
          count={metrics.liveSessions}
          icon={<Activity className="h-5 w-5 text-amber-400" />}
          variant="warning"
          secondaryNote={`${metrics.suspiciousCount} suspicious`}
        />
        <MetricCard
          label="Email Verified"
          count={`${verifiedPct}%`}
          icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
          variant={metrics.unverifiedCount > 0 ? "danger" : "success"}
          secondaryNote={`${metrics.unverifiedCount} unverified`}
          href="/users?verified=unverified"
        />
        <MetricCard
          label="Open Tickets"
          count={metrics.openTickets}
          icon={<LifeBuoy className="h-5 w-5 text-red-400" />}
          variant={metrics.openTickets > 0 ? "danger" : "success"}
          secondaryNote={`${metrics.inProgressTickets} in progress`}
        />
        <MetricCard
          label="Waitlist"
          count={metrics.waitlistTotal}
          icon={<Users2 className="h-5 w-5 text-indigo-400" />}
          variant="primary"
          secondaryNote={`+${metrics.newWaitlistThisWeek} this week`}
        />
      </div>

      {/* Revenue & Subscription Analytics Card */}
      <RevenueAnalytics
        totalUsers={metrics.totalUsers}
        proUsers={metrics.planDistribution.pro}
        freeUsers={metrics.planDistribution.free}
        newUsersThisWeek={metrics.newUsersThisWeek}
      />

      {/* System & Storage Infrastructure Health */}
      <SystemHealthWidget
        totalUsers={metrics.totalUsers}
        activeOrgs={metrics.activeOrgs}
        totalTenders={metrics.totalTenders}
        activeProjects={metrics.activeProjects}
        liveSessions={metrics.liveSessions}
      />

      {/* Tender Pipeline Health & Quick Status Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tender pipeline health */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">
            Tender Pipeline Distribution
          </h2>
          <div className="space-y-3">
            {pipelineStatuses.map(({ key, label, color }) => {
              const cnt = metrics.tenderByStatus[key];
              const pct =
                totalTenders > 0
                  ? ((cnt / totalTenders) * 100).toFixed(1)
                  : "0";
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{label}</span>
                    <span>
                      {cnt} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick-status panels */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Suspicious Sessions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Suspicious Active Sessions
              </h3>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {alertCounts.suspiciousSessions}
              </p>
              {suspiciousSessions.length > 0 ? (
                <ul className="space-y-1 mt-2">
                  {suspiciousSessions.slice(0, 3).map((s) => (
                    <li key={s.id} className="text-xs text-zinc-400 truncate">
                      {s.userEmail ?? "(unknown)"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 mt-2">
                  No active suspicious sessions.
                </p>
              )}
            </div>
            <a
              href="/sessions"
              className="inline-block text-xs text-indigo-400 hover:underline pt-2 font-medium"
            >
              Inspect all sessions →
            </a>
          </div>

          {/* Support Tickets Overview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Support Ticket Status
              </h3>
              <div className="space-y-2 text-xs text-zinc-400 mt-3">
                <div className="flex justify-between items-center p-2 bg-zinc-950/60 rounded-lg">
                  <span>Open Tickets</span>
                  <span className="font-bold text-red-400">
                    {metrics.openTickets}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-950/60 rounded-lg">
                  <span>In Progress</span>
                  <span className="font-bold text-amber-400">
                    {metrics.inProgressTickets}
                  </span>
                </div>
              </div>
            </div>
            <a
              href="/support-tickets"
              className="inline-block text-xs text-indigo-400 hover:underline pt-2 font-medium"
            >
              Review all tickets →
            </a>
          </div>
        </div>
      </div>

      {/* Security Audit Feed with Severity Filter */}
      <SecurityLogStream activity={recentActivity} />
    </div>
  );
}
