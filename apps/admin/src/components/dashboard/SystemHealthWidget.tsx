'use client';

import { Server, Database, Activity, CheckCircle2, ShieldCheck, Cloud } from 'lucide-react';
import Link from 'next/link';

type Props = {
  totalUsers: number;
  activeOrgs: number;
  totalTenders: number;
  activeProjects: number;
  liveSessions: number;
};

export default function SystemHealthWidget({
  totalUsers,
  activeOrgs,
  totalTenders,
  activeProjects,
  liveSessions,
}: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">System Infrastructure & Storage</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          All Systems Operational
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="text-[11px] text-zinc-500 font-medium">Database (PostgreSQL)</div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Healthy
          </div>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="text-[11px] text-zinc-500 font-medium">Auth Service</div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active ({liveSessions} live)
          </div>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="text-[11px] text-zinc-500 font-medium">Background Crons</div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Running
          </div>
        </div>

        <Link
          href="/reports"
          className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-colors group cursor-pointer block"
        >
          <div className="text-[11px] text-zinc-500 font-medium flex items-center justify-between">
            <span>Cloudflare R2</span>
            <Cloud className="h-3 w-3 text-amber-400" />
          </div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            10 GB Tier (Healthy)
          </div>
        </Link>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="text-[11px] text-zinc-500 font-medium">Tenders DB Index</div>
          <div className="text-xs font-semibold text-zinc-300 mt-1">
            {totalTenders.toLocaleString()} records
          </div>
        </div>

        <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
          <div className="text-[11px] text-zinc-500 font-medium">Active Projects</div>
          <div className="text-xs font-semibold text-zinc-300 mt-1">
            {activeProjects.toLocaleString()} active
          </div>
        </div>
      </div>
    </div>
  );
}
