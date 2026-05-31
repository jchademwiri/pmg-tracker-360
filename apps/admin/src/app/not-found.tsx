'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, Terminal } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 px-4 font-sans select-none">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center space-y-8 animate-in fade-in duration-500">
        
        {/* Authoritative Admin Visual Header */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl h-20 w-20 mx-auto" />
          <div className="h-16 w-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner relative z-10">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        {/* Title and Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
          <h2 className="text-xl font-bold text-zinc-200">Terminal Route Not Found</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-[90%] mx-auto">
            The database control route or management table you are attempting to query does not exist.
          </p>
        </div>

        {/* System Terminal Mock Details */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-left font-mono text-xs text-zinc-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">❯</span>
            <span>GET /admin/route-not-resolved</span>
          </div>
          <div className="text-rose-500/80">
            [SYS_ERR] Route resolution failed. Reference index undefined.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Home className="h-4 w-4" />
            Admin Console
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center flex items-center gap-2 text-[10px] text-zinc-600 font-mono tracking-wider uppercase">
        <Terminal className="h-3 w-3" />
        <span>Live Cluster Session • ERR_404_NOT_FOUND</span>
      </div>
    </div>
  );
}
