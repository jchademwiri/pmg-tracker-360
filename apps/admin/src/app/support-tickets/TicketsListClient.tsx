"use client";

import { useState, useEffect, useRef } from "react";
import type { TicketWithUser, TicketMessageItem } from "@/lib/admin-queries";
import DataTable, { type Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { PrioritySelect, type PriorityValue } from "./PrioritySelect";
import { FormattedMessage } from "./FormattedMessage";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  getTicketThreadAction,
  sendAdminTicketMessageAction,
  updateTicketStatus,
  updateTicketPriority,
  sendTicketTranscriptEmailAction,
  bulkUpdateTicketStatus,
  bulkDeleteTickets,
} from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LifeBuoy,
  MessageCircle,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  Search,
  ShieldCheck,
  FileText,
  Flame,
  Sparkles,
  Inbox,
  ArrowRight,
  Headphones,
  Check,
  Zap,
  RotateCcw,
  Mail,
  User,
  Lock,
  Eye,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

type Props = {
  tickets: TicketWithUser[];
};

type ViewMode = "split" | "table";
type FilterTab = "all" | "active" | "urgent" | "resolved";

const CANNED_RESPONSES = [
  {
    label: "⚡ Investigating",
    text: "Hello, thank you for reaching out. Our engineering and support team is currently investigating this inquiry and will update you shortly.",
  },
  {
    label: "📋 Request Info",
    text: "Could you please provide the tender reference number, document name, or a screenshot of the issue to help us resolve this faster?",
  },
  {
    label: "✅ Resolved",
    text: "We have reviewed your request and applied the necessary fix. Please verify on your dashboard and let us know if you need further assistance.",
  },
  {
    label: "🛠️ Escalated",
    text: "Your request has been escalated to our senior technical specialists. We will follow up as soon as the verification is complete.",
  },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function TicketsListClient({ tickets: initialTickets }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTicketId = searchParams.get("ticket") || searchParams.get("id");

  const [tickets, setTickets] = useState<TicketWithUser[]>(initialTickets);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketWithUser | null>(null);
  const [messages, setMessages] = useState<TicketMessageItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Multi-select for bulk actions
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(
    new Set(),
  );
  const [actionLoading, setActionLoading] = useState(false);

  // Composer state
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingTranscript, setSendingTranscript] = useState(false);
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
    requireValue?: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    action: async () => {},
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync tickets when props change
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  // Sync ticket with URL search param
  useEffect(() => {
    if (urlTicketId && initialTickets.length > 0) {
      const match = initialTickets.find(
        (t) =>
          t.id.toLowerCase() === urlTicketId.toLowerCase() ||
          (t.ticketCode &&
            t.ticketCode.toLowerCase() === urlTicketId.toLowerCase()) ||
          (t.ticketNumber && String(t.ticketNumber) === urlTicketId),
      );
      if (match && selectedTicketId !== match.id) {
        setSelectedTicketId(match.id);
        setActiveTicket(match);
      }
    } else if (!urlTicketId && selectedTicketId) {
      setSelectedTicketId(null);
      setActiveTicket(null);
      setMessages([]);
    }
  }, [urlTicketId, initialTickets]);

  // Load thread whenever selectedTicketId changes
  useEffect(() => {
    if (selectedTicketId) {
      loadThread(selectedTicketId);
    }
  }, [selectedTicketId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadThread = async (ticketId: string) => {
    setThreadLoading(true);
    const res = await getTicketThreadAction(ticketId);
    setThreadLoading(false);
    if (res.success && res.ticket) {
      setActiveTicket(res.ticket as TicketWithUser);
      setMessages((res.messages as TicketMessageItem[]) || []);
      // Mark unread as 0 locally
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, unreadCount: 0 } : t)),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("admin-support-count-updated"));
      }
    } else {
      showNotification("error", res.error || "Failed to load thread.");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    if (selectedTicketId) {
      await loadThread(selectedTicketId);
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim() || !activeTicket || sending) return;

    setSending(true);
    const res = await sendAdminTicketMessageAction({
      ticketId: activeTicket.id,
      message: replyMessage.trim(),
      isInternal,
      sendEmailNotification,
    });
    setSending(false);

    if (res.success) {
      setReplyMessage("");
      showNotification(
        "success",
        isInternal ? "Internal note added" : "Reply sent to user",
      );
      await loadThread(activeTicket.id);
      router.refresh();
    } else {
      showNotification("error", res.error || "Failed to send message.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeTicket) return;
    try {
      await updateTicketStatus(activeTicket.id, newStatus);
      setActiveTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id ? { ...t, status: newStatus } : t,
        ),
      );
      showNotification(
        "success",
        `Status updated to ${newStatus.toUpperCase()}`,
      );
    } catch (err: any) {
      showNotification("error", err.message || "Status update failed.");
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!activeTicket) return;
    try {
      await updateTicketPriority(activeTicket.id, newPriority);
      setActiveTicket((prev) =>
        prev ? { ...prev, priority: newPriority } : null,
      );
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id ? { ...t, priority: newPriority } : t,
        ),
      );
      showNotification(
        "success",
        `Priority updated to ${newPriority.toUpperCase()}`,
      );
    } catch (err: any) {
      showNotification("error", err.message || "Priority update failed.");
    }
  };

  const handleEmailTranscript = async () => {
    if (!activeTicket?.email) return;
    setSendingTranscript(true);
    const res = await sendTicketTranscriptEmailAction(
      activeTicket.id,
      activeTicket.email,
    );
    setSendingTranscript(false);
    if (res.success) {
      showNotification(
        "success",
        `Full transcript emailed to ${activeTicket.email}`,
      );
    } else {
      showNotification("error", res.error || "Failed to email transcript.");
    }
  };

  // Bulk Operations
  const toggleSelectTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status: string) => {
    const ids = Array.from(selectedTicketIds);
    setActionLoading(true);
    await bulkUpdateTicketStatus(ids, status);
    setActionLoading(false);
    setSelectedTicketIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedTicketIds);
    setActionLoading(true);
    await bulkDeleteTickets(ids);
    setActionLoading(false);
    setSelectedTicketIds(new Set());
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    router.refresh();
  };

  // Metrics
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (
      filterTab === "active" &&
      (t.status === "resolved" || t.status === "closed")
    )
      return false;
    if (filterTab === "urgent" && t.priority !== "urgent") return false;
    if (
      filterTab === "resolved" &&
      t.status !== "resolved" &&
      t.status !== "closed"
    )
      return false;

    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.ticketCode && t.ticketCode.toLowerCase().includes(q)) ||
      t.id.toLowerCase().includes(q) ||
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
  });

  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "urgent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-700/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]">
          <Flame className="h-3 w-3 text-rose-400 fill-rose-400" />
          Urgent
        </span>
      );
    }
    if (p === "high") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-700/60">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          High
        </span>
      );
    }
    if (p === "low") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-950/80 text-sky-300 border border-sky-700/60">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        Medium
      </span>
    );
  };

  // Table Columns
  const tableColumns: Column<TicketWithUser>[] = [
    {
      key: "select",
      header: "",
      render: (t) => (
        <button
          type="button"
          onClick={(e) => toggleSelectTicket(t.id, e)}
          className="text-zinc-400 hover:text-white cursor-pointer"
        >
          {selectedTicketIds.has(t.id) ? (
            <CheckSquare className="h-4 w-4 text-amber-400" />
          ) : (
            <Square className="h-4 w-4 text-zinc-600" />
          )}
        </button>
      ),
    },
    {
      key: "ref",
      header: "Ticket ID",
      render: (t) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            #
            {t.ticketCode ||
              (t.ticketNumber
                ? `TICK-${t.ticketNumber}`
                : `TICK-${t.id.slice(0, 8).toUpperCase()}`)}
          </span>
          {t.unreadCount && t.unreadCount > 0 ? (
            <span
              className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
              title="Unread message"
            />
          ) : null}
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject / Issue",
      render: (t) => (
        <div className="flex flex-col gap-0.5 max-w-sm">
          <span className="font-semibold text-zinc-100 truncate">
            {t.subject || "Support Request"}
          </span>
          <span className="text-xs text-zinc-400 line-clamp-1">
            {t.message}
          </span>
        </div>
      ),
    },
    {
      key: "submitter",
      header: "Submitter",
      render: (t) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-zinc-200">{t.name}</span>
          <span className="text-xs text-zinc-400">{t.email}</span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (t) => getPriorityBadge(t.priority),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "created",
      header: "Created",
      render: (t) => (
        <span className="text-xs text-zinc-400">
          {new Date(t.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col overflow-hidden max-w-[1700px] mx-auto w-full">
      {/* =========================================================================
          TOP COMMAND BAR (Always visible, fits on screen)
      ========================================================================= */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xs">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Support Operations Center
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Desk
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Executive two-way concierge, real-time ticket triage, and user
              communications.
            </p>
          </div>
        </div>

        {/* Status Counter Pills & View Mode Switch */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {tickets.some((t) => (t.unreadCount || 0) > 0) && (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl px-2.5 py-1 text-xs text-emerald-300 font-bold animate-pulse shadow-sm">
              <Mail className="h-3.5 w-3.5" />
              <span>
                {tickets.reduce((sum, t) => sum + (t.unreadCount || 0), 0)}{" "}
                Unread Msg(s)
              </span>
            </div>
          )}

          <div className="hidden xl:flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-100">
              All: {tickets.length}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-amber-400 font-semibold">
              Open: {openCount}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-blue-400 font-semibold">
              In Progress: {inProgressCount}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-semibold">
              Resolved: {resolvedCount}
            </span>
            {urgentCount > 0 && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-rose-400 font-bold">
                  Urgent: {urgentCount}
                </span>
              </>
            )}
          </div>

          {/* Refresh Live Desk */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Refresh Live Support Operations"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Concierge Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`shrink-0 mt-2 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/80 border border-emerald-700/60 text-emerald-300"
              : "bg-rose-950/80 border border-rose-700/60 text-rose-300"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-white ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* =========================================================================
          BATCH SELECTION ACTION BAR (Appears when tickets checked)
      ========================================================================= */}
      {selectedTicketIds.size > 0 && (
        <div className="shrink-0 mt-2 p-2.5 bg-amber-950/40 border border-amber-700/50 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-2 text-amber-200 font-medium">
            <span className="font-bold">{selectedTicketIds.size}</span>{" "}
            ticket(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: "Bulk In Progress",
                  description: `Mark ${selectedTicketIds.size} selected ticket(s) as In Progress?`,
                  confirmText: "Update to In Progress",
                  variant: "info",
                  action: () => handleBulkStatus("in_progress"),
                })
              }
              className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg cursor-pointer transition-all"
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: "Bulk Resolve",
                  description: `Mark ${selectedTicketIds.size} selected ticket(s) as Closed/Resolved?`,
                  confirmText: "Resolve Tickets",
                  variant: "warning",
                  action: () => handleBulkStatus("closed"),
                })
              }
              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg cursor-pointer transition-all"
            >
              Resolve
            </button>
            <button
              type="button"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  title: "Bulk Delete Tickets",
                  description: `Permanently delete ${selectedTicketIds.size} selected ticket(s)? This will also delete all message transcripts.`,
                  confirmText: "Delete Tickets",
                  variant: "danger",
                  action: handleBulkDelete,
                })
              }
              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg cursor-pointer transition-all flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTicketIds(new Set())}
              className="text-zinc-400 hover:text-white px-1.5 cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: SPLIT 2-PANE CONCIERGE DESK (Default Luxury Experience)
      ========================================================================= */}
      {viewMode === "split" && (
        <div className="flex-1 min-h-0 mt-3 grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-md overflow-hidden shadow-2xl">
          {/* =======================================================================
              LEFT PANE: TICKET OPERATIONS ROSTER (Internally scrollable)
          ======================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 border-r border-zinc-800/80 flex flex-col h-full min-h-0 overflow-hidden bg-zinc-950/40">
            {/* Search & Filter Header (Pinned) */}
            <div className="p-3 border-b border-zinc-800/80 space-y-2 bg-zinc-900/40 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ref #, user, subject, email..."
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/80 transition-all"
                />
              </div>

              {/* Status Segmented Tabs */}
              <div className="flex gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                {(["all", "active", "urgent", "resolved"] as FilterTab[]).map(
                  (tab) => {
                    const isActive = filterTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setFilterTab(tab)}
                        className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer capitalize ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* Ticket Roster List (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-2">
                  <Inbox className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-medium text-zinc-300">
                    No support tickets found
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    No tickets match the current filter or search criteria.
                  </p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  const isChecked = selectedTicketIds.has(t.id);
                  const isRecent =
                    new Date().getTime() - new Date(t.createdAt).getTime() <
                    24 * 60 * 60 * 1000;
                  const ticketCode =
                    t.ticketCode ||
                    (t.ticketNumber
                      ? `TICK-${t.ticketNumber}`
                      : `TICK-${t.id.slice(0, 8).toUpperCase()}`);

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        setActiveTicket(t);
                        if (typeof window !== "undefined") {
                          window.history.replaceState(
                            null,
                            "",
                            `/support-tickets?ticket=${t.id}`,
                          );
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 group relative ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30"
                          : "bg-zinc-900/60 hover:bg-zinc-800/60 border-zinc-800/80"
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => toggleSelectTicket(t.id, e)}
                            className="text-zinc-500 hover:text-white cursor-pointer mr-0.5"
                          >
                            {isChecked ? (
                              <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-zinc-600" />
                            )}
                          </button>
                          <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            #{ticketCode}
                          </span>
                          <StatusBadge status={t.status} />
                          {getPriorityBadge(t.priority)}
                          {isRecent && t.status === "open" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              NEW
                            </span>
                          )}
                        </div>

                        {t.unreadCount && t.unreadCount > 0 ? (
                          <span className="px-2 py-0.5 bg-emerald-500 text-black rounded-full text-[10px] font-extrabold animate-pulse shrink-0 flex items-center gap-1 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" />
                            {t.unreadCount} new reply
                          </span>
                        ) : null}
                      </div>

                      {/* Submitter & Subject */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-200 truncate group-hover:text-amber-300 transition-colors">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {new Date(t.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">
                          {t.subject || "Support Request"}
                        </h4>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {t.message}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                        <span className="truncate max-w-[170px]">
                          {t.email}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-zinc-400">
                          <MessageCircle className="h-3 w-3" />
                          <span>{t.messageCount || 1} msg(s)</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =======================================================================
              RIGHT PANE: CONCIERGE & RESOLUTION HUB (Pinned controls & composer)
          ======================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden bg-zinc-950">
            {activeTicket ? (
              <>
                {/* 1. Header (Pinned) */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 space-y-3 shrink-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                          #
                          {activeTicket.ticketCode ||
                            (activeTicket.ticketNumber
                              ? `TICK-${activeTicket.ticketNumber}`
                              : `TICK-${activeTicket.id.slice(0, 8).toUpperCase()}`)}
                        </span>
                        <StatusBadge status={activeTicket.status} />
                        {getPriorityBadge(activeTicket.priority)}
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white truncate">
                        {activeTicket.subject || "Support Request"}
                      </h2>
                    </div>

                    {/* Quick Transcript Action */}
                    <button
                      type="button"
                      onClick={handleEmailTranscript}
                      disabled={sendingTranscript}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 border border-zinc-700/80 shadow-xs"
                      title="Send full chat history to user email"
                    >
                      {sendingTranscript ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                      <span>Email Transcript</span>
                    </button>
                  </div>

                  {/* Submitter Info & Admin Inline Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    {/* User Card */}
                    <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {activeTicket.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">
                          {activeTicket.name}
                        </span>
                        <span className="text-zinc-400 text-[11px] truncate block">
                          {activeTicket.email}
                        </span>
                      </div>
                    </div>

                    {/* Live Status Control */}
                    <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-center">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        Ticket Status
                      </span>
                      <select
                        value={activeTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Live Priority Control */}
                    <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-center">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">
                        Ticket Priority
                      </span>
                      <PrioritySelect
                        value={activeTicket.priority}
                        onValueChange={handlePriorityChange}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Message History Stream (Internally scrollable) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-zinc-950/60">
                  {threadLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 px-4 space-y-2">
                      <MessageCircle className="h-8 w-8 text-zinc-600 mx-auto" />
                      <p className="text-xs font-semibold text-zinc-300">
                        No conversation history yet
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Post an admin reply below to initiate or update the
                        client thread.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdm = m.senderType === "admin";
                      const isInternalNote = m.isInternal;

                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 ${
                            isAdm ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                              isInternalNote
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : isAdm
                                  ? "bg-amber-500 text-black"
                                  : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                            }`}
                          >
                            {isInternalNote ? (
                              <Lock className="h-3.5 w-3.5 text-amber-400" />
                            ) : isAdm ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              m.senderName.slice(0, 1).toUpperCase()
                            )}
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md space-y-1.5 ${
                              isInternalNote
                                ? "bg-amber-950/30 border border-dashed border-amber-500/50 text-amber-100"
                                : isAdm
                                  ? "bg-amber-500/10 border border-amber-500/30 text-zinc-100"
                                  : "bg-zinc-900 border border-zinc-800 text-zinc-100"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400 pb-1 border-b border-zinc-800/40">
                              <span className="font-bold flex items-center gap-1.5">
                                {isInternalNote && (
                                  <span className="text-amber-400 font-semibold uppercase tracking-wider">
                                    [Internal Staff Note]
                                  </span>
                                )}
                                <span>{m.senderName}</span>
                                {isAdm && !isInternalNote && (
                                  <span className="text-amber-400 font-normal">
                                    (Concierge Admin)
                                  </span>
                                )}
                              </span>
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <FormattedMessage content={m.message} />
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 3. Admin Composer (Pinned at Bottom) */}
                <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/60 shrink-0 space-y-2.5">
                  {/* Mode & Canned Snippets Toolbar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Public vs Internal Note Switch */}
                    <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsInternal(false)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          !isInternal
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>Public Reply</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternal(true)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          isInternal
                            ? "bg-amber-500/30 text-amber-200 border border-amber-500/50"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Lock className="h-3 w-3 text-amber-400" />
                        <span>Internal Note</span>
                      </button>
                    </div>

                    {/* Canned Responses Chips */}
                    <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {CANNED_RESPONSES.map((cr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyMessage(cr.text)}
                          className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[10px] font-medium text-zinc-300 hover:text-amber-300 transition-all cursor-pointer shrink-0"
                          title={cr.text}
                        >
                          {cr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Composer Input Area */}
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={
                          isInternal
                            ? "🔒 Type an internal staff note (visible only to admins)..."
                            : "Type your reply to the user (Enter to send, Shift+Enter for new line)..."
                        }
                        className={`w-full p-3 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all resize-none ${
                          isInternal
                            ? "bg-amber-950/20 border border-amber-500/40 focus:border-amber-500"
                            : "bg-zinc-950 border border-zinc-800 focus:border-amber-500"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!isInternal && (
                          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sendEmailNotification}
                              onChange={(e) =>
                                setSendEmailNotification(e.target.checked)
                              }
                              className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                            <span>Email user reply alert</span>
                          </label>
                        )}
                        <span className="text-[10px] text-zinc-500 hidden md:inline">
                          Supports @mentions, `code`, **bold**, links
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={sending || !replyMessage.trim()}
                        className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50 ${
                          isInternal
                            ? "bg-amber-600 hover:bg-amber-500 text-black"
                            : "bg-amber-500 hover:bg-amber-400 text-black"
                        }`}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>
                              {isInternal
                                ? "Save Internal Note"
                                : "Send Public Reply"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="space-y-3 max-w-sm">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <LifeBuoy className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Select a Ticket
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Choose a support request from the roster on the left to
                    start live concierge triage.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: DENSE DATA ROSTER TABLE
      ========================================================================= */}
      {viewMode === "table" && (
        <div className="flex-1 min-h-0 mt-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col p-4">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <DataTable<TicketWithUser>
              data={filteredTickets}
              columns={tableColumns}
              rowKey={(t) => t.id}
              onRowClick={(t: TicketWithUser) => {
                setSelectedTicketId(t.id);
                setActiveTicket(t);
                setViewMode("split");
                if (typeof window !== "undefined") {
                  window.history.replaceState(
                    null,
                    "",
                    `/support-tickets?ticket=${t.id}`,
                  );
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogState.action}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        variant={dialogState.variant}
        requireConfirmationValue={dialogState.requireValue}
      />
    </div>
  );
}
