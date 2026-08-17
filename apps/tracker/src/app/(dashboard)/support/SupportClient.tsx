"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LifeBuoy,
  MessageCircle,
  Send,
  Loader2,
  Plus,
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
  Mail,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getUserSupportTickets,
  getUserTicketThread,
  sendUserTicketMessage,
  createSupportTicket,
  emailUserTicketTranscript,
} from "@/server/support";
import { useSessionUser } from "@/lib/client-session-store";
import { FormattedMessage } from "@/components/support/formatted-message";
import { PrioritySelect } from "@/components/support/priority-select";
import { toast } from "sonner";

type UserTicket = {
  id: string;
  ticketNumber?: number | null;
  ticketCode: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  ticketId: string;
  senderId: string | null;
  senderType: "user" | "admin" | "system";
  senderName: string;
  senderEmail: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

type FilterTab = "all" | "active" | "resolved";

export default function SupportClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTicketId = searchParams.get("ticket") || searchParams.get("id");

  const user = useSessionUser();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [unreadTotal, setUnreadTotal] = useState<number>(0);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<UserTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Chat message reply
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingTranscript, setSendingTranscript] = useState(false);

  // New ticket modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createPriority, setCreatePriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.name && !createName) setCreateName(user.name);
      if (user.email && !createEmail) setCreateEmail(user.email);
    }
  }, [user]);

  // Sync ticket when url param changes
  useEffect(() => {
    if (urlTicketId && tickets.length > 0) {
      const match = tickets.find(
        (t) =>
          t.id.toLowerCase() === urlTicketId.toLowerCase() ||
          (t.ticketCode &&
            t.ticketCode.toLowerCase() === urlTicketId.toLowerCase()) ||
          (t.ticketNumber && String(t.ticketNumber) === urlTicketId),
      );
      if (match && selectedTicketId !== match.id) {
        openThread(match.id, false);
      }
    } else if (!urlTicketId && selectedTicketId) {
      setSelectedTicketId(null);
      setActiveTicket(null);
      setMessages([]);
    }
  }, [urlTicketId, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    const res = await getUserSupportTickets();
    setLoading(false);
    if (res.success && res.tickets) {
      const list = res.tickets as UserTicket[];
      setTickets(list);
      setUnreadTotal(res.unreadTotal || 0);

      // If URL already specifies a ticket ID, open that ticket
      const initialParam = searchParams.get("ticket") || searchParams.get("id");
      if (initialParam) {
        const found = list.find(
          (t) =>
            t.id.toLowerCase() === initialParam.toLowerCase() ||
            (t.ticketCode &&
              t.ticketCode.toLowerCase() === initialParam.toLowerCase()) ||
            (t.ticketNumber && String(t.ticketNumber) === initialParam),
        );
        if (found) {
          openThread(found.id, false);
        }
      }
    }
  };

  const openThread = async (ticketId: string, updateUrl: boolean = true) => {
    setSelectedTicketId(ticketId);
    if (updateUrl && typeof window !== "undefined") {
      window.history.replaceState(null, "", `/support?ticket=${ticketId}`);
    }
    setThreadLoading(true);
    const res = await getUserTicketThread(ticketId);
    setThreadLoading(false);
    if (res.success && res.ticket) {
      setActiveTicket(res.ticket as unknown as UserTicket);
      setMessages((res.messages || []) as ChatMessage[]);
      // Clear unread indicator locally
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, unreadCount: 0 } : t)),
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("support-count-updated"));
      }
      scrollToBottom();
    } else {
      toast.error(res.error || "Failed to load conversation thread.");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketId || sending) return;

    const messageText = replyMessage.trim();
    setSending(true);
    const res = await sendUserTicketMessage(selectedTicketId, messageText);
    setSending(false);

    if (res.success) {
      setReplyMessage("");
      const threadRes = await getUserTicketThread(selectedTicketId);
      if (threadRes.success && threadRes.messages) {
        setMessages(threadRes.messages as ChatMessage[]);
        scrollToBottom();
      }
      loadTickets();
    } else {
      toast.error(res.error || "Failed to send message.");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSubject.trim()) {
      toast.error("Please enter a subject for your request.");
      return;
    }
    if (!createMessage.trim()) {
      toast.error("Please describe your question or issue.");
      return;
    }

    setCreating(true);
    const res = await createSupportTicket({
      name: createName.trim() || user?.name || "User",
      email: createEmail.trim() || user?.email || "",
      subject: createSubject.trim(),
      priority: createPriority,
      message: createMessage.trim(),
      userId: user?.id,
    });
    setCreating(false);

    if (res.success && res.ticketId) {
      toast.success("Support request created successfully!");
      setCreateModalOpen(false);
      setCreateSubject("");
      setCreateMessage("");
      setCreatePriority("medium");
      await loadTickets();
      openThread(res.ticketId);
    } else {
      toast.error(res.error || "Failed to submit support request.");
    }
  };

  const handleEmailTranscript = async () => {
    if (!selectedTicketId) return;
    setSendingTranscript(true);
    const res = await emailUserTicketTranscript(selectedTicketId);
    setSendingTranscript(false);
    if (res.success) {
      toast.success(
        res.message || "Conversation transcript sent to your email!",
      );
    } else {
      toast.error(res.error || "Failed to email transcript.");
    }
  };

  // Metrics
  const activeCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;

  // Filtered tickets
  const filteredTickets = tickets
    .filter((t) => {
      if (filterTab === "active")
        return t.status === "open" || t.status === "in_progress";
      if (filterTab === "resolved")
        return t.status === "resolved" || t.status === "closed";
      return true;
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        t.message.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q)
      );
    });

  const getPriorityBadge = (priority: string) => {
    const p = (priority || "medium").toLowerCase();
    if (p === "urgent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-700/60 shadow-xs">
          <Flame className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
          Urgent
        </span>
      );
    }
    if (p === "high") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-700/60 shadow-xs">
          High
        </span>
      );
    }
    if (p === "low") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800/90 text-zinc-300 border border-zinc-700">
          Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-950/90 text-sky-300 border border-sky-700/60">
        Medium
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "resolved" || s === "closed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          Resolved
        </span>
      );
    }
    if (s === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-700/60">
          <Clock className="h-3 w-3 text-blue-400" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-700/60">
        <Zap className="h-3 w-3 text-amber-400" />
        Open
      </span>
    );
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden max-w-[1700px] mx-auto w-full">
      {/* =========================================================================
          TOP COMMAND BAR (Always visible, fits on screen)
      ========================================================================= */}
      <div className="shrink-0 flex items-center justify-between gap-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Support Desk
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Support
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Direct two-way concierge support, real-time ticket tracking, and
              transcript preservation.
            </p>
          </div>
        </div>

        {/* Action Button & Status Counter Pills */}
        <div className="flex items-center gap-3">
          {unreadTotal > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-bold animate-pulse shadow-sm">
              <Mail className="h-3.5 w-3.5" />
              <span>{unreadTotal} Unread Response(s)</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 bg-muted/30 border rounded-xl px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              <strong className="text-amber-400">{activeCount}</strong> Active
            </span>
            <span>•</span>
            <span className="font-medium text-foreground">
              <strong className="text-emerald-400">{resolvedCount}</strong>{" "}
              Resolved
            </span>
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="h-9 px-4 gap-2 cursor-pointer font-semibold shadow-md shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Ticket</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-PANE WORKSPACE (Zero outer page scroll, fits inside window)
      ========================================================================= */}
      <div className="flex-1 min-h-0 mt-3 grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xl">
        {/* =========================================================================
            LEFT PANE: TICKET ROSTER (Permits internal scroll only)
        ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 border-r border-border/70 flex flex-col h-full min-h-0 overflow-hidden bg-muted/5">
          {/* Search & Filter Header (Pinned) */}
          <div className="p-3 border-b border-border/70 space-y-2 bg-background/40 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries or references..."
                className="w-full pl-9 pr-3 py-1.5 bg-muted/40 border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
              {(["all", "active", "resolved"] as FilterTab[]).map((tab) => {
                const isActive = filterTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterTab(tab)}
                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-all cursor-pointer capitalize ${
                      isActive
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket List (SCROLLABLE ONLY HERE) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <Inbox className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-medium text-foreground">
                  No tickets in this view
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Click "Create New Ticket" above to open a request.
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                const isRecent =
                  new Date().getTime() - new Date(t.createdAt).getTime() <
                  24 * 60 * 60 * 1000;

                return (
                  <div
                    key={t.id}
                    onClick={() => openThread(t.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 group ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30"
                        : "bg-card/80 hover:bg-muted/50 border-border/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          #
                          {t.ticketCode ||
                            `TICK-${t.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        {getStatusBadge(t.status)}
                        {getPriorityBadge(t.priority)}
                        {isRecent && t.status === "open" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            NEW
                          </span>
                        )}
                      </div>

                      {t.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-black rounded-full text-[10px] font-extrabold animate-pulse shrink-0 flex items-center gap-1 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" />
                          {t.unreadCount} new reply
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {t.subject || "Support Request"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(t.updatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-medium group-hover:text-primary">
                        <MessageCircle className="h-3 w-3" />
                        <span>{t.messageCount} msg(s)</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANE: LIVE CONVERSATION HUB (Fits within window, messages scroll inside)
        ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden bg-background/50">
          {activeTicket ? (
            <>
              {/* Header (Pinned) */}
              <div className="p-3.5 border-b border-border/70 flex items-center justify-between bg-muted/20 gap-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                      #
                      {activeTicket.ticketCode ||
                        `TICK-${activeTicket.id.slice(0, 8).toUpperCase()}`}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                    {getPriorityBadge(activeTicket.priority)}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {activeTicket.subject || "Support Request"}
                  </h2>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    Opened by {activeTicket.name} •{" "}
                    {new Date(activeTicket.createdAt).toLocaleString("en-GB")}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmailTranscript}
                  disabled={sendingTranscript}
                  className="h-8 text-xs gap-1.5 cursor-pointer shrink-0 bg-background/80 hover:bg-muted"
                >
                  {sendingTranscript ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Email Transcript</span>
                </Button>
              </div>

              {/* Message Timeline (SCROLLABLE ONLY HERE) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-muted/10">
                {threadLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-4 bg-card border rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-foreground">
                      Initial Inquiry:
                    </span>
                    <FormattedMessage
                      content={activeTicket.message}
                      className="text-zinc-300 text-xs"
                    />
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.senderType === "admin";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                          {isAdmin ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Tender Track Support Team
                            </span>
                          ) : (
                            <span className="font-medium text-foreground">
                              You
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm ${
                            isAdmin
                              ? "bg-card border text-foreground rounded-tl-xs"
                              : "bg-[#1a3a52] text-white rounded-tr-xs"
                          }`}
                        >
                          <FormattedMessage content={m.message} />
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer (Pinned at bottom, ALWAYS in view) */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-border/70 bg-background/90 backdrop-blur-sm flex items-center gap-2 shrink-0"
              >
                <textarea
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type your message (Enter to send, Shift+Enter for newline, supports @mentions, `code`, **bold**)..."
                  className="flex-1 px-3.5 py-2.5 bg-muted/40 border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground leading-relaxed"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || !replyMessage.trim()}
                  className="h-11 px-5 gap-1.5 cursor-pointer shrink-0 font-semibold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
                <LifeBuoy className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Select a Support Conversation
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a ticket from the left panel to inspect the conversation
                timeline or start a new request.
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="gap-2 cursor-pointer mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Request</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CREATE NEW TICKET MODAL (Spacious, Executive layout)
      ========================================================================= */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-background border shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-foreground">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <span>Create New Support Request</span>
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Provide details about your inquiry or technical question. Our
              support team will respond directly in your live chat.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-5 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-11 px-3.5 bg-muted/40 border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="name@company.co.za"
                  required
                  className="w-full h-11 px-3.5 bg-muted/40 border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  placeholder="e.g. Unable to submit Eskom compliance pack"
                  required
                  className="w-full h-11 px-3.5 bg-muted/40 border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Priority
                </label>
                <PrioritySelect
                  value={createPriority}
                  onValueChange={(val) => setCreatePriority(val)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Inquiry Details <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Supports @mentions, `code`, **bold**, links
                </span>
              </div>
              <textarea
                rows={7}
                value={createMessage}
                onChange={(e) => setCreateMessage(e.target.value)}
                placeholder="Describe your question or issue in detail. Include any relevant tender references, error messages, or steps that led to the issue..."
                required
                className="w-full p-4 bg-muted/40 border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground resize-y leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="h-11 px-5 cursor-pointer text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  creating || !createSubject.trim() || !createMessage.trim()
                }
                className="h-11 px-6 gap-2 cursor-pointer text-sm font-semibold shadow-sm"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit & Open Live Chat</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
