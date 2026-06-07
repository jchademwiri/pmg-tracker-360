'use client';

import { useEffect, useCallback, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getOrgDetail, type OrgDetail } from '../app/organizations/actions';

/* ─── State Machine ─────────────────────────────────────────────────────── */

type DrawerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: OrgDetail };

/* ─── Props ─────────────────────────────────────────────────────────────── */

type OrgDrawerProps = {
  orgId: string | null;
  onClose: () => void;
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */

function DrawerSkeleton() {
  return (
    <div className="space-y-3 animate-pulse p-6">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-4 bg-zinc-800 rounded w-1/2" />
      <div className="h-4 bg-zinc-800 rounded w-2/3" />
      <div className="h-px bg-zinc-800 my-4" />
      <div className="h-10 bg-zinc-800 rounded" />
      <div className="h-10 bg-zinc-800 rounded" />
      <div className="h-10 bg-zinc-800 rounded" />
      <div className="h-10 bg-zinc-800 rounded" />
      <div className="h-10 bg-zinc-800 rounded" />
    </div>
  );
}

/* ─── Loaded Body ───────────────────────────────────────────────────────── */

function DrawerBody({ data }: { data: OrgDetail }) {
  const { org, members, invitations } = data;

  let metadataDisplay: string | null = null;
  if (org.metadata) {
    try {
      metadataDisplay = JSON.stringify(JSON.parse(org.metadata), null, 2);
    } catch {
      metadataDisplay = org.metadata;
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Org metadata */}
      <section className="space-y-2 text-sm">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Organisation Details
        </h3>

        <div className="flex justify-between">
          <span className="text-zinc-500">Name</span>
          <span className="text-white font-medium">{org.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Slug</span>
          <span className="text-zinc-300">{org.slug ?? '—'}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">ID</span>
          <span className="text-zinc-400 font-mono text-xs">
            {org.id.slice(0, 8)}…
          </span>
        </div>

        {org.logo && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Logo</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={org.logo}
              alt={`${org.name} logo`}
              className="h-8 w-8 rounded object-cover"
            />
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-zinc-500">Created</span>
          <span className="text-zinc-300">{formatDate(org.createdAt)}</span>
        </div>

        {org.deletedAt && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Deleted</span>
            <span className="text-red-400">{formatDate(org.deletedAt)}</span>
          </div>
        )}

        {org.deletionReason && (
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500">Deletion Reason</span>
            <span className="text-zinc-300 text-xs">{org.deletionReason}</span>
          </div>
        )}

        {org.permanentDeletionScheduledAt && (
          <div className="flex justify-between">
            <span className="text-zinc-500">Purge Date</span>
            <span className="text-amber-400">
              {formatDate(org.permanentDeletionScheduledAt)}
            </span>
          </div>
        )}

        {metadataDisplay && (
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-zinc-500">Metadata</span>
            <pre className="text-xs text-zinc-400 bg-zinc-900 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
              {metadataDisplay}
            </pre>
          </div>
        )}
      </section>

      <div className="h-px bg-zinc-800" />

      {/* Members */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">No members.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-3 py-1"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                  {getInitials(m.userName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white font-medium truncate">
                    {m.userName}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {m.userEmail}
                  </div>
                </div>

                <StatusBadge status={m.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending Invitations — only shown when > 0 */}
      {invitations.length > 0 && (
        <>
          <div className="h-px bg-zinc-800" />

          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Pending Invitations ({invitations.length})
            </h3>

            <ul className="space-y-2">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 text-sm py-1"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-white truncate">{inv.email}</div>
                    <div className="text-xs text-zinc-400">
                      Expires {formatDate(inv.expiresAt)}
                    </div>
                  </div>
                  <StatusBadge status={inv.role} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

/* ─── OrgDrawer ─────────────────────────────────────────────────────────── */

export default function OrgDrawer({ orgId, onClose }: OrgDrawerProps) {
  const [state, setState] = useState<DrawerState>({ status: 'idle' });

  // Fetch org detail whenever orgId changes
  const fetchOrgDetail = useCallback(
    async (id: string) => {
      setState({ status: 'loading' });
      try {
        const data = await getOrgDetail(id);
        setState({ status: 'loaded', data });
      } catch (err) {
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    []
  );

  useEffect(() => {
    if (orgId === null) {
      setState({ status: 'idle' });
    } else {
      fetchOrgDetail(orgId);
    }
  }, [orgId, fetchOrgDetail]);

  // Escape key listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Nothing to show when idle
  if (state.status === 'idle') return null;

  // Resolve header title
  const title =
    state.status === 'loaded'
      ? state.data.org.name
      : state.status === 'error'
      ? 'Error'
      : 'Loading…';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-zinc-950 border-l border-zinc-800 z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <h2 className="text-base font-semibold text-white truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {state.status === 'loading' && <DrawerSkeleton />}

        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-2 py-8 text-zinc-500 p-6">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm">Failed to load organisation details.</p>
            <button
              onClick={() => orgId && fetchOrgDetail(orgId)}
              className="text-xs text-indigo-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === 'loaded' && <DrawerBody data={state.data} />}
      </aside>
    </>
  );
}
