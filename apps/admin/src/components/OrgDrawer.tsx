"use client";

import { useEffect, useCallback, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import { getOrgDetail, type OrgDetail } from "../app/organizations/actions";
import { AdminOrgEditSchema } from "@/lib/validations";

/* ─── State Machine ─────────────────────────────────────────────────────── */

type DrawerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; data: OrgDetail };

/* ─── Props ─────────────────────────────────────────────────────────────── */

type OrgDrawerProps = {
  orgId: string | null;
  onClose: () => void;
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
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

import {
  updateOrgDetails,
  suspendOrg,
  restoreOrg,
  purgeOrg,
  removeOrgMember,
} from "../app/organizations/actions";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RotateCcw,
  ShieldAlert,
  Edit2,
  UserMinus,
  Check,
  Loader,
} from "lucide-react";

function DrawerBody({
  data,
  onRefresh,
  onClose,
}: {
  data: OrgDetail;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const { org, members, invitations } = data;
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(org.name);
  const [slugInput, setSlugInput] = useState(org.slug ?? "");
  const [orgFieldErrors, setOrgFieldErrors] = useState<Record<string, string>>(
    {},
  );
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuspended = Boolean(org.deletedAt);

  let metadataDisplay: string | null = null;
  if (org.metadata) {
    if (typeof org.metadata === "string") {
      try {
        metadataDisplay = JSON.stringify(JSON.parse(org.metadata), null, 2);
      } catch {
        metadataDisplay = org.metadata;
      }
    } else if (typeof org.metadata === "object") {
      try {
        metadataDisplay = JSON.stringify(org.metadata, null, 2);
      } catch {
        metadataDisplay = String(org.metadata);
      }
    } else {
      metadataDisplay = String(org.metadata);
    }
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setOrgFieldErrors({});

    const result = AdminOrgEditSchema.safeParse({
      name: nameInput,
      slug: slugInput,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setOrgFieldErrors(errors);
      return;
    }

    setActionLoading(true);
    const res = await updateOrgDetails(org.id, nameInput, slugInput);
    setActionLoading(false);
    if (res.success) {
      setIsEditing(false);
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? "Failed to update organization details.");
    }
  }

  async function handleSuspend() {
    setActionLoading(true);
    setErrorMsg(null);
    const res = await suspendOrg(org.id, suspendReason);
    setActionLoading(false);
    if (res.success) {
      setShowSuspendModal(false);
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? "Failed to suspend organization.");
    }
  }

  async function handleRestore() {
    setActionLoading(true);
    setErrorMsg(null);
    const res = await restoreOrg(org.id);
    setActionLoading(false);
    if (res.success) {
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? "Failed to restore organization.");
    }
  }

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: "danger" | "warning" | "info";
    requireValue?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    onConfirm: async () => {},
  });

  async function executePurge() {
    setActionLoading(true);
    setErrorMsg(null);
    const res = await purgeOrg(org.id);
    setActionLoading(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? "Failed to purge organization.");
    }
  }

  async function executeRemoveMember(userId: string) {
    setActionLoading(true);
    setErrorMsg(null);
    const res = await removeOrgMember(org.id, userId);
    setActionLoading(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (res.success) {
      onRefresh();
      router.refresh();
    } else {
      setErrorMsg(res.error ?? "Failed to remove member.");
    }
  }

  function handlePurgeClick() {
    setConfirmDialog({
      isOpen: true,
      title: "Purge Organization",
      description: `PERMANENTLY delete organization "${org.name}" and all associated data? This action cannot be undone.`,
      confirmText: "Purge Organization",
      variant: "danger",
      requireValue: "PURGE",
      onConfirm: executePurge,
    });
  }

  function handleRemoveMemberClick(userId: string, userName: string) {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Organization Member",
      description: `Are you sure you want to remove ${userName} from ${org.name}?`,
      confirmText: "Remove Member",
      variant: "warning",
      onConfirm: () => executeRemoveMember(userId),
    });
  }

  return (
    <div className="p-6 space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Header bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {isEditing ? "Cancel Edit" : "Edit Info"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isSuspended ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleRestore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore
            </button>
          ) : (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setShowSuspendModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/80 text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Suspend
            </button>
          )}

          <button
            type="button"
            disabled={actionLoading}
            onClick={handlePurgeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge
          </button>
        </div>
      </div>

      {/* Suspend confirmation modal */}
      {showSuspendModal && (
        <div className="p-4 bg-zinc-900 border border-amber-900/60 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Suspend Organization
          </h4>
          <p className="text-xs text-zinc-400">
            This will soft-delete the organization and schedule permanent purge
            in 72 hours.
          </p>
          <input
            type="text"
            placeholder="Reason for suspension (optional)"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSuspendModal(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSuspend}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
            >
              {actionLoading ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                "Confirm Suspend"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {isEditing ? (
        <form
          onSubmit={handleSaveDetails}
          className="space-y-4 bg-zinc-900 p-4 border border-zinc-800 rounded-xl"
        >
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Edit Details
          </h4>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Organization Name</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (orgFieldErrors.name) {
                  const { name, ...rest } = orgFieldErrors;
                  setOrgFieldErrors(rest);
                }
              }}
              className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-sm text-white focus:outline-none ${orgFieldErrors.name ? "border-red-500" : "border-zinc-800"}`}
            />
            {orgFieldErrors.name && (
              <p className="text-xs text-red-400">{orgFieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Slug</label>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => {
                setSlugInput(e.target.value);
                if (orgFieldErrors.slug) {
                  const { slug, ...rest } = orgFieldErrors;
                  setOrgFieldErrors(rest);
                }
              }}
              placeholder="organization-slug"
              className={`w-full px-3 py-2 bg-zinc-950 border rounded-lg text-sm text-white focus:outline-none ${orgFieldErrors.slug ? "border-red-500" : "border-zinc-800"}`}
            />
            {orgFieldErrors.slug && (
              <p className="text-xs text-red-400">{orgFieldErrors.slug}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 flex items-center gap-1"
            >
              {actionLoading ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* Org metadata display */
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
            <span className="text-zinc-300">{org.slug ?? "—"}</span>
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
              <span className="text-zinc-500">Status</span>
              <span className="text-red-400 font-semibold">
                SUSPENDED ({formatDate(org.deletedAt)})
              </span>
            </div>
          )}

          {org.deletionReason && (
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500">Reason</span>
              <span className="text-zinc-300 text-xs">
                {org.deletionReason}
              </span>
            </div>
          )}

          {org.permanentDeletionScheduledAt && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Scheduled Purge</span>
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
      )}

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
              <li key={m.userId} className="flex items-center gap-3 py-1">
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

                <button
                  type="button"
                  title="Remove Member"
                  disabled={actionLoading}
                  onClick={() => handleRemoveMemberClick(m.userId, m.userName)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
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

/* ─── OrgDrawer ─────────────────────────────────────────────────────────── */

export default function OrgDrawer({ orgId, onClose }: OrgDrawerProps) {
  const [state, setState] = useState<DrawerState>({ status: "idle" });

  // Fetch org detail whenever orgId changes
  const fetchOrgDetail = useCallback(async (id: string) => {
    setState({ status: "loading" });
    try {
      const data = await getOrgDetail(id);
      setState({ status: "loaded", data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    if (orgId === null) {
      setState({ status: "idle" });
    } else {
      fetchOrgDetail(orgId);
    }
  }, [orgId, fetchOrgDetail]);

  // Escape key listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Nothing to show when idle
  if (state.status === "idle") return null;

  // Resolve header title
  const title =
    state.status === "loaded"
      ? state.data.org.name
      : state.status === "error"
        ? "Error"
        : "Loading…";

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
        {state.status === "loading" && <DrawerSkeleton />}

        {state.status === "error" && (
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

        {state.status === "loaded" && (
          <DrawerBody
            data={state.data}
            onRefresh={() => orgId && fetchOrgDetail(orgId)}
            onClose={onClose}
          />
        )}
      </aside>
    </>
  );
}
