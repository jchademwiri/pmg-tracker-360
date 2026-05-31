import React from 'react';
import { db } from '@pmg/db';
import { organization } from '@pmg/db/schema';
import { desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Building2, Globe, Clock, ShieldCheck, Tag } from 'lucide-react';

export default async function AdminOrganizationsPage() {
  // 1. Authenticate & Verify Admin Role
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/login');
  }

  // 2. Fetch all platform tenant organizations
  const allOrgs = await db
    .select()
    .from(organization)
    .orderBy(desc(organization.createdAt));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Building2 className="h-8 w-8 text-[var(--primary)]" />
          Manage Organizations
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Monitor, audit, and audit tenant workspaces across the Tender Track 360 ecosystem.
        </p>
      </div>

      {/* Orgs list table container */}
      <div className="overflow-hidden bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-950/40 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                <th className="py-4 px-6">Tenant Name</th>
                <th className="py-4 px-6">Slug Routing</th>
                <th className="py-4 px-6">Subscription Tier</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Creation Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {allOrgs.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-800/20 transition-colors">
                  {/* Tenant Name */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-zinc-850 border border-zinc-700/40 text-amber-500 flex items-center justify-center font-bold">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{o.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                          ID: {o.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Slug Route */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
                      <Globe className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{o.slug || 'no-slug-configured'}</span>
                    </div>
                  </td>

                  {/* Pricing Tier */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-1 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <Tag className="h-3.5 w-3.5 text-zinc-500" />
                      <span>standard</span>
                    </div>
                  </td>

                  {/* Active Status */}
                  <td className="py-4.5 px-6">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-4.5 px-6 text-zinc-400 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-zinc-600" />
                      {new Date(o.createdAt).toLocaleDateString()}
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
