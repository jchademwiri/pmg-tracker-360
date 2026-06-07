'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SuspiciousSession } from '@/lib/admin-queries';
import DataTable, { type Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { revokeAdminSession } from './actions';

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

export function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/*  Revoke modal                                                               */
/* -------------------------------------------------------------------------- */

type RevokeModalProps = {
  target: SuspiciousSession;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
};

function RevokeModal({ target, onCancel, onConfirm, isPending, error }: RevokeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">Revoke Session</h2>
        <p className="text-sm text-zinc-400">
          Are you sure you want to revoke this session? The user will be immediately signed out.
        </p>
        <div className="bg-zinc-800/60 rounded-lg p-3 space-y-1 text-xs">
          <div>
            <span className="text-zinc-500">Session ID: </span>
            <span className="font-mono text-zinc-300">{target.id.slice(0, 8)}</span>
          </div>
          <div>
            <span className="text-zinc-500">User: </span>
            <span className="text-zinc-300">{target.userEmail ?? '—'}</span>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Revoking…' : 'Confirm Revoke'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Client component                                                           */
/* -------------------------------------------------------------------------- */

type Props = {
  sessions: SuspiciousSession[];
  viewMode: 'suspicious' | 'all';
};

export default function SessionsListClient({ sessions, viewMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [revokeModalTarget, setRevokeModalTarget] = useState<SuspiciousSession | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /* ---- Toggle view ---- */
  function handleToggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (viewMode === 'suspicious') {
      params.set('view', 'all');
      params.delete('page');
    } else {
      params.delete('view');
      params.delete('page');
    }
    router.push(`/sessions?${params.toString()}`);
  }

  /* ---- Revoke handler ---- */
  function handleConfirmRevoke() {
    if (!revokeModalTarget) return;
    setRevokeError(null);
    startTransition(async () => {
      try {
        await revokeAdminSession(revokeModalTarget.id);
        setRevokeModalTarget(null);
        router.refresh();
      } catch (err) {
        setRevokeError(err instanceof Error ? err.message : 'Failed to revoke session.');
      }
    });
  }

  /* ---- Column definitions ---- */
  const columns: Column<SuspiciousSession>[] = [
    {
      key: 'id',
      header: 'Session ID',
      render: (s) => (
        <span className="font-mono text-xs text-zinc-400">{s.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'email',
      header: 'User Email',
      render: (s) => (
        <span className="text-sm text-zinc-300">{s.userEmail ?? '—'}</span>
      ),
    },
    {
      key: 'ip',
      header: 'IP Address',
      render: (s) => (
        <span className={`text-sm ${s.isSuspicious ? 'text-red-400' : 'text-zinc-400'}`}>
          {s.ipAddress ?? '—'}
        </span>
      ),
    },
    {
      key: 'browser',
      header: 'Browser / OS',
      render: (s) => {
        const device = safeParse(s.deviceInfo, {} as Record<string, string>);
        const browser = device?.browser ?? '—';
        const os = device?.os ?? '—';
        return (
          <span className="text-xs text-zinc-400">
            {browser} / {os}
          </span>
        );
      },
    },
    {
      key: 'location',
      header: 'Location',
      render: (s) => {
        const loc = safeParse(s.locationInfo, {} as Record<string, string>);
        const city = loc?.city ?? '—';
        const country = loc?.country ?? '';
        return (
          <span className="text-xs text-zinc-400">
            {city} {country}
          </span>
        );
      },
    },
    {
      key: 'login',
      header: 'Login Time',
      render: (s) => (
        <span className="text-xs text-zinc-500">
          {new Date(s.loginTime).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'activity',
      header: 'Last Activity',
      render: (s) => (
        <span className="text-xs text-zinc-500">
          {formatRelativeTime(new Date(s.lastActivity))}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <StatusBadge status={s.isSuspicious ? 'suspicious' : 'active'} />
      ),
    },
    {
      key: 'revoke',
      header: 'Actions',
      render: (s) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setRevokeModalTarget(s);
            setRevokeError(null);
          }}
          className="px-2.5 py-1 text-xs rounded-md border border-red-700/50 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Revoke
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toggle button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            viewMode === 'suspicious'
              ? 'bg-red-600 border-red-500 text-white'
              : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          Suspicious Only
        </button>
        <button
          type="button"
          onClick={handleToggle}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            viewMode === 'all'
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          All Active
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={sessions}
        rowKey={(s) => s.id}
      />

      {/* Revoke confirmation modal */}
      {revokeModalTarget !== null && (
        <RevokeModal
          target={revokeModalTarget}
          onCancel={() => {
            setRevokeModalTarget(null);
            setRevokeError(null);
          }}
          onConfirm={handleConfirmRevoke}
          isPending={isPending}
          error={revokeError}
        />
      )}
    </div>
  );
}
