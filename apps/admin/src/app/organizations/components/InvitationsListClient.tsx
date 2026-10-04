"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { AdminInvitationItem } from "@/lib/admin-queries";
import {
  resendOrgInvitation,
  extendOrgInvitation,
  revokeOrgInvitation,
  bulkRevokeOrgInvitations,
  bulkPurgeExpiredInvitations,
} from "../actions";
import {
  Mail,
  Clock,
  AlertTriangle,
  RotateCcw,
  CalendarPlus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  X,
  CheckSquare,
} from "lucide-react";

type InvitationsListClientProps = {
  invitations: AdminInvitationItem[];
  initialFilter?: string;
};

function formatExpiryCountdown(date: Date): { text: string; isPast: boolean } {
  const diffMs = new Date(date).getTime() - Date.now();
  const isPast = diffMs <= 0;
  const absDiff = Math.abs(diffMs);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (isPast) {
    if (days > 0) return { text: `Expired ${days}d ago`, isPast: true };
    return { text: `Expired ${hours}h ago`, isPast: true };
  }

  if (days > 0) return { text: `Expires in ${days}d`, isPast: false };
  return { text: `Expires in ${hours}h`, isPast: false };
}

export default function InvitationsListClient({
  invitations,
  initialFilter = "all",
}: InvitationsListClientProps) {
  const router = useRouter();

  // Normalize initial filter
  const validInitialFilter =
    initialFilter === "expiring" ||
    initialFilter === "expired" ||
    initialFilter === "pending"
      ? initialFilter
      : "all";

  const [filter, setFilter] = useState<"all" | "expiring" | "expired" | "pending">(
    validInitialFilter,
  );
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Confirm dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: "danger" | "warning" | "info";
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    action: async () => {},
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // KPIs
  const totalPending = invitations.filter((i) => i.status === "pending").length;
  const expiringSoonCount = invitations.filter((i) => i.isExpiringSoon).length;
  const expiredCount = invitations.filter((i) => i.isExpired).length;

  // Filtered dataset
  const filtered = useMemo(() => {
    return invitations
      .filter((inv) => {
        if (filter === "expiring") return inv.isExpiringSoon;
        if (filter === "expired") return inv.isExpired;
        if (filter === "pending") return inv.status === "pending";
        return true;
      })
      .filter((inv) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          inv.email.toLowerCase().includes(q) ||
          inv.organizationName.toLowerCase().includes(q) ||
          (inv.inviterName && inv.inviterName.toLowerCase().includes(q)) ||
          (inv.inviterEmail && inv.inviterEmail.toLowerCase().includes(q))
        );
      });
  }, [invitations, filter, search]);

  // Actions
  async function handleResend(inv: AdminInvitationItem) {
    setActionLoading(true);
    const res = await resendOrgInvitation(inv.id);
    setActionLoading(false);
    if (res.success) {
      showNotification("success", res.message || `Invitation resent to ${inv.email}.`);
      router.refresh();
    } else {
      showNotification("error", res.error || "Failed to resend invitation.");
    }
  }

  async function handleExtend(inv: AdminInvitationItem) {
    setActionLoading(true);
    const res = await extendOrgInvitation(inv.id, 7);
    setActionLoading(false);
    if (res.success) {
      showNotification("success", res.message || `Extended invitation by 7 days.`);
      router.refresh();
    } else {
      showNotification("error", res.error || "Failed to extend invitation.");
    }
  }

  async function handleRevoke(inv: AdminInvitationItem) {
    setDialogState({
      isOpen: true,
      title: "Revoke Invitation",
      description: `Are you sure you want to cancel the invitation for ${inv.email} to join ${inv.organizationName}?`,
      confirmText: "Revoke Invitation",
      variant: "danger",
      action: async () => {
        setActionLoading(true);
        const res = await revokeOrgInvitation(inv.id);
        setActionLoading(false);
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        if (res.success) {
          showNotification("success", `Cancelled invitation for ${inv.email}.`);
          router.refresh();
        } else {
          showNotification("error", res.error || "Failed to revoke invitation.");
        }
      },
    });
  }

  async function handleBulkPurgeExpired() {
    setDialogState({
      isOpen: true,
      title: "Purge All Expired Invitations",
      description: `This will cancel all ${expiredCount} past-due pending invitations across all organizations. This action cannot be undone.`,
      confirmText: "Cancel All Expired",
      variant: "danger",
      action: async () => {
        setActionLoading(true);
        const res = await bulkPurgeExpiredInvitations();
        setActionLoading(false);
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        if (res.success) {
          showNotification("success", res.message || "All expired invitations cancelled.");
          setSelectedIds(new Set());
          router.refresh();
        } else {
          showNotification("error", res.error || "Failed to purge expired invitations.");
        }
      },
    });
  }

  async function handleBulkRevokeSelected() {
    const count = selectedIds.size;
    if (count === 0) return;

    setDialogState({
      isOpen: true,
      title: `Revoke ${count} Selected Invitation(s)`,
      description: `Are you sure you want to cancel ${count} selected invitation(s)?`,
      confirmText: "Revoke Selected",
      variant: "danger",
      action: async () => {
        setActionLoading(true);
        const res = await bulkRevokeOrgInvitations(Array.from(selectedIds));
        setActionLoading(false);
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        if (res.success) {
          showNotification("success", res.message || `Cancelled ${count} invitation(s).`);
          setSelectedIds(new Set());
          router.refresh();
        } else {
          showNotification("error", res.error || "Failed to cancel selected invitations.");
        }
      },
    });
  }

  // Table Columns
  const columns: Column<AdminInvitationItem>[] = [
    {
      key: "email",
      header: "Recipient Email",
      render: (inv) => (
        <div>
          <div className="font-medium text-white flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate max-w-[220px]">{inv.email}</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
            ID: {inv.id.slice(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      render: (inv) => (
        <div>
          <Link
            href={`/organizations/${inv.organizationId}`}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {inv.organizationName}
          </Link>
          {inv.organizationSlug && (
            <div className="text-xs text-zinc-500 font-mono">
              /{inv.organizationSlug}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (inv) => <StatusBadge status={inv.role || "member"} />,
    },
    {
      key: "inviter",
      header: "Invited By",
      render: (inv) => (
        <div className="text-xs">
          <div className="text-zinc-200">{inv.inviterName || "—"}</div>
          <div className="text-zinc-500">{inv.inviterEmail || "System"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status & Expiry",
      render: (inv) => {
        const { text, isPast } = formatExpiryCountdown(inv.expiresAt);

        if (inv.status === "cancelled") {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <XCircle className="h-3.5 w-3.5" /> Cancelled
            </span>
          );
        }

        if (inv.status === "accepted") {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
            </span>
          );
        }

        if (inv.isExpired) {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-400 border border-red-800/80">
                <AlertTriangle className="h-3 w-3 shrink-0" /> {text}
              </span>
              <div className="text-[10px] text-zinc-500">
                {new Date(inv.expiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          );
        }

        if (inv.isExpiringSoon) {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                <Clock className="h-3 w-3 shrink-0" /> {text}
              </span>
              <div className="text-[10px] text-zinc-500">
                {new Date(inv.expiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-0.5 text-xs text-zinc-400">
            <div>{text}</div>
            <div className="text-[10px] text-zinc-500">
              {new Date(inv.expiresAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (inv) => {
        if (inv.status === "cancelled" || inv.status === "accepted") {
          return <span className="text-zinc-600 text-xs">—</span>;
        }

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleResend(inv)}
              title="Resend invitation email and reset expiry to 7 days"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" /> Resend
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleExtend(inv)}
              title="Extend invitation expiration by 7 days"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <CalendarPlus className="h-3 w-3" /> +7d
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleRevoke(inv)}
              title="Cancel this invitation"
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300"
              : "bg-red-950/60 border-red-800/80 text-red-300"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Pending Invitations</span>
            <Mail className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalPending}</div>
          <p className="text-[11px] text-zinc-500">Across all tenant workspaces</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Expiring Within 48 Hours</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div
            className={`text-2xl font-bold ${
              expiringSoonCount > 0 ? "text-amber-400" : "text-white"
            }`}
          >
            {expiringSoonCount}
          </div>
          <p className="text-[11px] text-zinc-500">Require immediate extension or follow up</p>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Already Expired</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div
            className={`text-2xl font-bold ${
              expiredCount > 0 ? "text-red-400" : "text-white"
            }`}
          >
            {expiredCount}
          </div>
          <p className="text-[11px] text-zinc-500">Stale links that need cleanup</p>
        </div>
      </div>

      {/* Action Banner for Expired Invitations */}
      {expiredCount > 0 && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-red-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">
                {expiredCount} invitation(s) have passed their expiration date
              </p>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                These invitations can no longer be accepted by users. Purge them to clean up the alert banner.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleBulkPurgeExpired}
            className="px-3.5 py-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            Purge All Expired ({expiredCount})
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
          {[
            { key: "all", label: "All", count: invitations.length },
            { key: "expiring", label: "Expiring (<48h)", count: expiringSoonCount },
            { key: "expired", label: "Expired", count: expiredCount },
            { key: "pending", label: "Pending", count: totalPending },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filter === tab.key
                    ? "bg-indigo-700 text-white"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, org, or inviter..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-indigo-200 font-medium">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>{selectedIds.size} invitation(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkRevokeSelected}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1.5 text-zinc-400 hover:text-zinc-200"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Invitations Table */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        variant={dialogState.variant}
        onConfirm={dialogState.action}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
