import React from 'react';
import { db } from '@pmg/db';
import { user, organization, tender, project } from '@pmg/db/schema';
import { count, desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  Users,
  Building2,
  FileText,
  Briefcase,
  TrendingUp,
  Clock,
  LogOut,
} from 'lucide-react';
import { adminSignOut } from './actions';

export default async function AdminDashboardPage() {
  // 1. Session Verification
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== 'admin') {
    // If no administrators exist in the database, redirect to initial setup
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

  // 2. Direct Database Analytics Querying
  const usersCountResult = await db.select({ count: count() }).from(user);
  const orgsCountResult = await db.select({ count: count() }).from(organization);
  const tendersCountResult = await db.select({ count: count() }).from(tender);
  const projectsCountResult = await db.select({ count: count() }).from(project);

  const totalUsers = usersCountResult[0]?.count ?? 0;
  const totalOrgs = orgsCountResult[0]?.count ?? 0;
  const totalTenders = tendersCountResult[0]?.count ?? 0;
  const totalProjects = projectsCountResult[0]?.count ?? 0;

  // 3. Fetch Recent Registrations
  const recentUsers = await db
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(5);

  // 4. Fetch Active Tenant Organizations
  const activeOrgs = await db
    .select()
    .from(organization)
    .orderBy(desc(organization.createdAt))
    .limit(5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            System Console
          </h1>
          <p className="text-sm text-zinc-400">
            Real-time analytics and platform administration controls.
          </p>
        </div>
        <form action={adminSignOut}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer text-zinc-300"
          >
            <LogOut className="h-4 w-4" />
            End Session
          </button>
        </form>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Users Metric */}
        <div className="relative overflow-hidden p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-lg backdrop-blur-sm group">
          <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Total Users
          </div>
          <div className="text-3xl font-extrabold mt-3 text-white">
            {totalUsers}
          </div>
          <div className="text-[10px] text-indigo-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Registered accounts
          </div>
        </div>

        {/* Organizations Metric */}
        <div className="relative overflow-hidden p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-lg backdrop-blur-sm group">
          <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Building2 className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Orgs
          </div>
          <div className="text-3xl font-extrabold mt-3 text-white">
            {totalOrgs}
          </div>
          <div className="text-[10px] text-amber-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Tenant organizations
          </div>
        </div>

        {/* Tenders Metric */}
        <div className="relative overflow-hidden p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-lg backdrop-blur-sm group">
          <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Tenders Tracked
          </div>
          <div className="text-3xl font-extrabold mt-3 text-white">
            {totalTenders}
          </div>
          <div className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Active opportunities
          </div>
        </div>

        {/* Projects Metric */}
        <div className="relative overflow-hidden p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-lg backdrop-blur-sm group">
          <div className="absolute right-4 top-4 h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <Briefcase className="h-5 w-5 text-rose-400" />
          </div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Projects
          </div>
          <div className="text-3xl font-extrabold mt-3 text-white">
            {totalProjects}
          </div>
          <div className="text-[10px] text-rose-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            In-progress contracts
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Registrations Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--primary)]" />
              Recent System Registrations
            </h3>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Last 5
            </span>
          </div>

          <div className="divide-y divide-zinc-800/60 space-y-4">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between pt-4 first:pt-0">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.role === 'admin' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {u.role}
                  </span>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3 text-zinc-600" />
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tenant Orgs Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--primary)]" />
              Active System Organizations
            </h3>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Last 5
            </span>
          </div>

          <div className="divide-y divide-zinc-800/60 space-y-4">
            {activeOrgs.map((o) => (
              <div key={o.id} className="flex items-center justify-between pt-4 first:pt-0">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-white">{o.name}</p>
                  <p className="text-xs text-zinc-400">slug: {o.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    active
                  </span>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3 text-zinc-600" />
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
