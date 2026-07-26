'use client';

import { useEffect, useCallback, useState } from 'react';
import { AlertCircle, X, ShieldAlert, Trash2, ShieldCheck, Zap, User, Loader } from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  getUserDetail,
  updateUserRole,
  updateUserPlan,
  toggleUserSuspension,
  deleteUserAccount,
  type UserDetail,
} from '../app/users/actions';
import { useRouter } from 'next/navigation';

type DrawerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: UserDetail };

type UserDrawerProps = {
  userId: string | null;
  onClose: () => void;
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DrawerSkeleton() {
  return (
    <div className="space-y-3 animate-pulse p-6">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-4 bg-zinc-800 rounded w-1/2" />
      <div className="h-4 bg-zinc-800 rounded w-2/3" />
      <div className="h-px bg-zinc-800 my-4" />
      <div className="h-10 bg-zinc-800 rounded" />
      <div className="h-10 bg-zinc-800 rounded" />
    </div>
  );
}

import ConfirmDialog from './ConfirmDialog';

function UserDrawerBody({
  data,
  onRefresh,
  onClose,
}: {
  data: UserDetail;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    requireValue?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: async () => {},
  });

  async function executeToggleRole() {
    const targetRole = data.role === 'admin' ? 'user' : 'admin';
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await updateUserRole(data.id, targetRole);
    setActionLoading(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (res.success) {
      setSuccessMsg(res.message ?? null);
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? 'Failed to update role.');
    }
  }

  async function executeSetPlan(targetPlan: 'free' | 'starter' | 'pro') {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await updateUserPlan(data.id, targetPlan);
    setActionLoading(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (res.success) {
      setSuccessMsg(res.message ?? null);
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? 'Failed to update plan.');
    }
  }

  async function executeSuspend() {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await toggleUserSuspension(data.id, true);
    setActionLoading(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (res.success) {
      setSuccessMsg(res.message ?? null);
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? 'Failed to suspend user.');
    }
  }

  async function executeDelete() {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await deleteUserAccount(data.id);
    setActionLoading(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? 'Failed to delete user.');
    }
  }

  return (
    <div className="p-6 space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg flex items-center gap-2 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action Header bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Change User Role',
                description: `Change ${data.name}'s system role to ${data.role === 'admin' ? 'USER' : 'ADMIN'}?`,
                confirmText: `Set as ${data.role === 'admin' ? 'User' : 'Admin'}`,
                variant: 'info',
                onConfirm: executeToggleRole,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <User className="w-3.5 h-3.5" />
            Set {data.role === 'admin' ? 'User' : 'Admin'}
          </button>

          {/* Plan selectors */}
          <div className="flex items-center gap-1.5">
            {(['free', 'starter', 'pro'] as const).map((p) => (
              <button
                key={p}
                type="button"
                disabled={actionLoading || data.plan === p}
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: `Switch to ${p.toUpperCase()} Plan`,
                    description: `Change ${data.name}'s plan from ${data.plan.toUpperCase()} to ${p.toUpperCase()}?`,
                    confirmText: `Set ${p.toUpperCase()}`,
                    variant: 'info',
                    onConfirm: () => executeSetPlan(p),
                  })
                }
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer disabled:opacity-40 ${
                  data.plan === p
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                Set {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Suspend User Account',
                description: `Revoke all active sessions and suspend access for ${data.name} (${data.email})?`,
                confirmText: 'Suspend Account',
                variant: 'warning',
                onConfirm: executeSuspend,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Suspend
          </button>

          <button
            type="button"
            disabled={actionLoading}
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Delete User Account',
                description: `Permanently delete ${data.name} (${data.email})? This action cannot be undone.`,
                confirmText: 'Delete Account',
                variant: 'danger',
                requireValue: 'DELETE',
                onConfirm: executeDelete,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* User Details */}
      <section className="space-y-2 text-sm">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          User Account Profile
        </h3>

        <div className="flex justify-between">
          <span className="text-zinc-500">Name</span>
          <span className="text-white font-medium">{data.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Email</span>
          <span className="text-zinc-300">{data.email}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Email Verified</span>
          <StatusBadge status={data.emailVerified ? 'verified' : 'unverified'} />
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">System Role</span>
          <StatusBadge status={data.role} />
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Subscription Plan</span>
          <StatusBadge status={data.plan} />
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Registered</span>
          <span className="text-zinc-300">{formatDate(data.createdAt)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">Auth Provider</span>
          <span className="text-zinc-400 text-xs font-mono">
            {data.providerId === 'credential' ? 'Password' : data.providerId ?? '—'}
          </span>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* Active Sessions */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Active Sessions ({data.sessions.length})
        </h3>

        {data.sessions.length === 0 ? (
          <p className="text-xs text-zinc-500">No active sessions (User is currently signed out or suspended).</p>
        ) : (
          <ul className="space-y-2">
            {data.sessions.map((s) => (
              <li key={s.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-zinc-300 font-mono">
                  <span>IP: {s.ipAddress ?? 'Unknown'}</span>
                  <span className="text-zinc-500">Expires {formatDate(s.expiresAt)}</span>
                </div>
                <div className="text-zinc-500 truncate" title={s.userAgent ?? ''}>
                  {s.userAgent ?? 'No user agent'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="h-px bg-zinc-800" />

      {/* Organization Memberships */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Organization Memberships ({data.memberships.length})
        </h3>

        {data.memberships.length === 0 ? (
          <p className="text-xs text-zinc-500">No organization memberships.</p>
        ) : (
          <ul className="space-y-2">
            {data.memberships.map((m) => (
              <li key={m.orgId} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
                <span className="text-white font-medium">{m.orgName}</span>
                <StatusBadge status={m.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        requireConfirmationValue={confirmDialog.requireValue}
        loading={actionLoading}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function UserDrawer({ userId, onClose }: UserDrawerProps) {
  const [state, setState] = useState<DrawerState>({ status: 'idle' });

  const fetchUserDetail = useCallback(async (id: string) => {
    setState({ status: 'loading' });
    try {
      const data = await getUserDetail(id);
      setState({ status: 'loaded', data });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    if (userId === null) {
      setState({ status: 'idle' });
    } else {
      fetchUserDetail(userId);
    }
  }, [userId, fetchUserDetail]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (state.status === 'idle') return null;

  const title =
    state.status === 'loaded'
      ? state.data.name
      : state.status === 'error'
      ? 'Error'
      : 'Loading…';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-zinc-950 border-l border-zinc-800 z-50 overflow-y-auto">
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

        {state.status === 'loading' && <DrawerSkeleton />}

        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-2 py-8 text-zinc-500 p-6">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm">Failed to load user details.</p>
            <button
              onClick={() => userId && fetchUserDetail(userId)}
              className="text-xs text-indigo-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {state.status === 'loaded' && (
          <UserDrawerBody
            data={state.data}
            onRefresh={() => userId && fetchUserDetail(userId)}
            onClose={onClose}
          />
        )}
      </aside>
    </>
  );
}
