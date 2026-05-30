import React from 'react';
import { db } from '@pmg/db';
import { user, member, organization } from '@pmg/db/schema';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, Mail, CheckCircle, ShieldAlert, Award, Calendar } from 'lucide-react';
import { InviteAdminModal } from './components/invite-admin-modal';

export default async function AdminUsersPage() {
  // 1. Authenticate & Verify Admin Role
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Fetch all system users
  const allUsers = await db.select().from(user).orderBy(desc(user.createdAt));

  // 3. Fetch all memberships with their organizations
  const allMemberships = await db
    .select({
      userId: member.userId,
      role: member.role,
      orgName: organization.name,
      orgSlug: organization.slug,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id));

  // Group memberships by user ID
  const userMembershipsMap = allMemberships.reduce((acc, m) => {
    if (!acc[m.userId]) {
      acc[m.userId] = [];
    }
    acc[m.userId].push(m);
    return acc;
  }, {} as Record<string, typeof allMemberships>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-[var(--primary)]" />
            Manage Users
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Inspect, audit, and manage all user accounts registered across the platform.
          </p>
        </div>
        <div className="flex items-center">
          <InviteAdminModal />
        </div>
      </div>

      {/* Users table list container */}
      <div className="overflow-hidden bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-950/40 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                <th className="py-4 px-6">Identified User</th>
                <th className="py-4 px-6">Email Status</th>
                <th className="py-4 px-6">Subscription Plan</th>
                <th className="py-4 px-6">System Role</th>
                <th className="py-4 px-6">Organization Roles</th>
                <th className="py-4 px-6">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {allUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                  {/* User details */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center border border-zinc-700/50">
                        {u.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-zinc-600" />
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-4.5 px-6">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Pricing Plan */}
                  <td className="py-4.5 px-6 uppercase tracking-wider text-xs">
                    <span className={`inline-flex items-center gap-1 font-bold ${
                      u.plan === 'pro' 
                        ? 'text-amber-400' 
                        : 'text-zinc-400'
                    }`}>
                      <Award className={`h-4.5 w-4.5 ${u.plan === 'pro' ? 'text-amber-500' : 'text-zinc-600'}`} />
                      {u.plan}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="py-4.5 px-6 text-xs font-bold uppercase tracking-wider">
                    <span className={`px-2 py-0.5 rounded-md ${
                      u.role === 'admin' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Organization Roles */}
                  <td className="py-4.5 px-6 text-xs">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {userMembershipsMap[u.id]?.map((m, idx) => (
                        <span 
                          key={idx} 
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            m.role === 'owner' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : m.role === 'admin'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : m.role === 'manager'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/30'
                          }`}
                          title={`${m.orgName} - ${m.role}`}
                        >
                          {m.orgName}: {m.role}
                        </span>
                      )) ?? (
                        <span className="text-zinc-600 text-xs italic">No organizations</span>
                      )}
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="py-4.5 px-6 text-zinc-400 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4 text-zinc-600" />
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
