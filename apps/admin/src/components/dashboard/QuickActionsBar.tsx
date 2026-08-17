"use client";

import Link from "next/link";
import { ShieldAlert, Building2, Users, LifeBuoy, Zap } from "lucide-react";

export default function QuickActionsBar() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-indigo-400 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-white">
            Admin Quick Actions
          </h3>
          <p className="text-xs text-zinc-400">
            Fast shortcuts for platform moderation and management
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/sessions"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 border border-red-800/80 hover:bg-red-900/80 text-xs font-semibold text-red-200 rounded-lg transition-colors"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Suspicious Sessions
        </Link>

        <Link
          href="/organizations"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors"
        >
          <Building2 className="h-3.5 w-3.5 text-amber-400" />
          Pending Purges
        </Link>

        <Link
          href="/users"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors"
        >
          <Users className="h-3.5 w-3.5 text-indigo-400" />
          Manage Users
        </Link>

        <Link
          href="/support-tickets"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors"
        >
          <LifeBuoy className="h-3.5 w-3.5 text-emerald-400" />
          Support Tickets
        </Link>
      </div>
    </div>
  );
}
