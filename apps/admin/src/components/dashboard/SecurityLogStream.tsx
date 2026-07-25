'use client';

import { useState } from 'react';
import type { ActivityEntry } from '@/lib/admin-queries';
import { ShieldCheck, Filter } from 'lucide-react';

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  activity: ActivityEntry[];
};

export default function SecurityLogStream({ activity }: Props) {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filtered = activity.filter((item) =>
    severityFilter === 'all' ? true : item.severity === severityFilter
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Security & Audit Event Feed</h2>
        </div>

        {/* Severity Filter buttons */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 border border-zinc-800 rounded-lg">
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors capitalize ${
                severityFilter === sev
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-zinc-500 py-4 text-center">No security activity matching severity "{severityFilter}".</p>
      ) : (
        <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {filtered.map((entry) => {
            const dotColor =
              entry.severity === 'critical'
                ? 'bg-red-500'
                : entry.severity === 'warning'
                ? 'bg-amber-500'
                : 'bg-blue-500';

            const badgeStyle =
              entry.severity === 'critical'
                ? 'bg-red-950/80 text-red-300 border-red-800/80'
                : entry.severity === 'warning'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                : 'bg-blue-950/80 text-blue-300 border-blue-800/80';

            return (
              <li
                key={entry.id}
                className="flex items-center justify-between p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-xs gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  <span className="font-semibold text-zinc-200 shrink-0">
                    {entry.userName ?? 'System'}
                  </span>
                  <span className="text-zinc-400 truncate" title={entry.action}>
                    {entry.action}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                    {entry.severity}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
