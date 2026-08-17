"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StatusBadge from "@/components/StatusBadge";
import {
  LifeBuoy,
  User,
  Mail,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { TicketWithUser, TicketMessageItem } from "@/lib/admin-queries";
import { FormattedMessage } from "./FormattedMessage";
import { PrioritySelect } from "./PrioritySelect";
import {
  getTicketThreadAction,
  sendAdminTicketMessageAction,
  updateTicketStatus,
  updateTicketPriority,
  sendTicketTranscriptEmailAction,
} from "./actions";

type Props = {
  ticket: TicketWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: () => void;
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TicketDetailDrawer({
  ticket,
  open,
  onOpenChange,
  onTicketUpdated,
}: Props) {
  const [messages, setMessages] = useState<TicketMessageItem[]>([]);
  const [currentTicket, setCurrentTicket] = useState<TicketWithUser | null>(
    ticket,
  );
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingTranscript, setSendingTranscript] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load thread messages
  useEffect(() => {
    if (open && ticket?.id) {
      setCurrentTicket(ticket);
      setNotification(null);
      loadThread(ticket.id);
    }
  }, [open, ticket?.id]);

  const loadThread = async (id: string) => {
    setLoading(true);
    const res = await getTicketThreadAction(id);
    setLoading(false);
    if (res.success && res.messages) {
      setMessages(res.messages as TicketMessageItem[]);
      if (res.ticket) {
        setCurrentTicket(res.ticket as TicketWithUser);
      }
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentTicket) return;

    setSending(true);
    const res = await sendAdminTicketMessageAction({
      ticketId: currentTicket.id,
      message: newMessage.trim(),
      isInternal,
      sendEmailNotification: notifyEmail,
    });
    setSending(false);

    if (res.success) {
      setNewMessage("");
      await loadThread(currentTicket.id);
      onTicketUpdated?.();
    } else {
      showNotification("error", res.error || "Failed to send message.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentTicket) return;
    try {
      await updateTicketStatus(currentTicket.id, newStatus);
      setCurrentTicket((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
      onTicketUpdated?.();
      showNotification("success", `Status changed to ${newStatus}`);
    } catch (err: any) {
      showNotification("error", err.message || "Status update failed.");
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!currentTicket) return;
    try {
      await updateTicketPriority(currentTicket.id, newPriority);
      setCurrentTicket((prev) =>
        prev ? { ...prev, priority: newPriority } : null,
      );
      onTicketUpdated?.();
      showNotification("success", `Priority updated to ${newPriority}`);
    } catch (err: any) {
      showNotification("error", err.message || "Priority update failed.");
    }
  };

  const handleEmailTranscript = async () => {
    if (!currentTicket?.email) return;
    setSendingTranscript(true);
    const res = await sendTicketTranscriptEmailAction(
      currentTicket.id,
      currentTicket.email,
    );
    setSendingTranscript(false);
    if (res.success) {
      showNotification(
        "success",
        `Full transcript emailed to ${currentTicket.email}`,
      );
    } else {
      showNotification("error", res.error || "Failed to email transcript.");
    }
  };

  if (!currentTicket) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 p-0 flex flex-col h-full overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/60 space-y-3">
          {notification && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium ${
                notification.type === "success"
                  ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
                  : "bg-rose-950/70 border border-rose-800 text-rose-300"
              }`}
            >
              {notification.message}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <LifeBuoy className="h-5 w-5 text-amber-400" />
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  #
                  {currentTicket.ticketCode ||
                    (currentTicket.ticketNumber
                      ? `TICK-${currentTicket.ticketNumber}`
                      : `TICK-${currentTicket.id.slice(0, 8).toUpperCase()}`)}
                </span>
                <StatusBadge status={currentTicket.status} />
              </div>
              <SheetTitle className="text-base font-bold text-white truncate">
                {currentTicket.subject || "Support Request"}
              </SheetTitle>
            </div>

            {/* Quick Actions */}
            <button
              onClick={handleEmailTranscript}
              disabled={sendingTranscript}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
              title="Email full conversation transcript to user"
            >
              {sendingTranscript ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileText className="h-3 w-3 text-zinc-400" />
              )}
              <span>Email Transcript</span>
            </button>
          </div>

          {/* Submitter & Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Submitter
              </span>
              <span className="font-medium text-white truncate block">
                {currentTicket.name}
              </span>
              <span className="text-zinc-400 text-[11px] truncate block">
                {currentTicket.email}
              </span>
            </div>

            <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold mb-1">
                Status
              </span>
              <select
                value={currentTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold mb-1">
                Priority
              </span>
              <PrioritySelect
                value={currentTicket.priority}
                onValueChange={handlePriorityChange}
              />
            </div>
          </div>
        </div>

        {/* Chat Thread Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-950/40">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400">
              <p className="font-semibold text-white mb-1">
                Initial Ticket Message:
              </p>
              <p className="whitespace-pre-wrap">{currentTicket.message}</p>
            </div>
          ) : (
            messages.map((m) => {
              const isAdmin = m.senderType === "admin";
              const isInternalNote = m.isInternal;

              if (isInternalNote) {
                return (
                  <div
                    key={m.id}
                    className="p-3.5 bg-amber-950/20 border border-dashed border-amber-800/60 rounded-xl space-y-1 my-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-amber-400/80 font-medium">
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Internal Note by {m.senderName}
                      </span>
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-400">
                      {isAdmin ? "You (Support)" : m.senderName}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                      isAdmin
                        ? "bg-amber-600/90 text-white rounded-tr-xs"
                        : "bg-zinc-800 text-zinc-200 rounded-tl-xs border border-zinc-700/60"
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

        {/* Message Composer Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-zinc-800 bg-zinc-900/80 space-y-3"
        >
          {/* Toggles */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                disabled={isInternal}
                className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>Notify user via email alert</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-amber-400/90 select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-amber-800 bg-zinc-950 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <Lock className="h-3 w-3" />
              <span>Internal Note (staff only)</span>
            </label>
          </div>

          {/* Text input & send button */}
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={
                isInternal
                  ? "Add internal staff note (hidden from customer)..."
                  : "Type your message to the customer (Enter to send, Shift+Enter for newline)..."
              }
              className={`flex-1 px-3 py-2 bg-zinc-950 border rounded-xl text-xs sm:text-sm text-white focus:outline-none placeholder:text-zinc-600 resize-none ${
                isInternal
                  ? "border-amber-900/60 focus:border-amber-500/80"
                  : "border-zinc-800 focus:border-amber-500/80"
              }`}
            />

            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex flex-col items-center justify-center gap-1 shrink-0 ${
                isInternal
                  ? "bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-50"
                  : "bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
              }`}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="text-[10px]">
                {isInternal ? "Note" : "Send"}
              </span>
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
