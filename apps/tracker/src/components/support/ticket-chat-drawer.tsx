'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LifeBuoy,
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Mail,
  User,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  getUserSupportTickets,
  getUserTicketThread,
  sendUserTicketMessage,
  createSupportTicket,
  emailUserTicketTranscript,
} from '@/server/support';
import { toast } from 'sonner';
import { useSessionUser } from '@/lib/client-session-store';
import { FormattedMessage } from './formatted-message';
import { PrioritySelect } from './priority-select';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTicketId?: string | null;
};

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
  senderType: 'user' | 'admin' | 'system';
  senderName: string;
  senderEmail: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

export function TicketChatModal({ open, onOpenChange, initialTicketId }: Props) {
  const [view, setView] = useState<'list' | 'thread' | 'create'>('list');
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(initialTicketId || null);
  const [activeTicket, setActiveTicket] = useState<UserTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);

  // New message state
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingTranscript, setSendingTranscript] = useState(false);

  const user = useSessionUser();

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createSubject, setCreateSubject] = useState('');
  const [createPriority, setCreatePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [createMessage, setCreateMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync user details to form
  useEffect(() => {
    if (user) {
      if (user.name && !createName) setCreateName(user.name);
      if (user.email && !createEmail) setCreateEmail(user.email);
    }
  }, [user]);

  // Load ticket list on open
  useEffect(() => {
    if (open) {
      loadTickets();
      if (initialTicketId) {
        openThread(initialTicketId);
      }
    }
  }, [open, initialTicketId]);

  const loadTickets = async () => {
    setLoading(true);
    const res = await getUserSupportTickets();
    setLoading(false);
    if (res.success && res.tickets) {
      setTickets(res.tickets as UserTicket[]);
      if (res.tickets.length === 0 && !activeTicketId) {
        setView('create');
      }
    }
  };

  const openThread = async (ticketId: string) => {
    setActiveTicketId(ticketId);
    setView('thread');
    setThreadLoading(true);
    const res = await getUserTicketThread(ticketId);
    setThreadLoading(false);
    if (res.success && res.ticket) {
      setActiveTicket(res.ticket as unknown as UserTicket);
      setMessages((res.messages || []) as ChatMessage[]);
      scrollToBottom();
    } else {
      toast.error(res.error || 'Failed to load conversation thread.');
      setView('list');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;

    const messageText = replyMessage.trim();
    setSending(true);
    const res = await sendUserTicketMessage(activeTicketId, messageText);
    setSending(false);

    if (res.success) {
      setReplyMessage('');
      // Reload thread
      const threadRes = await getUserTicketThread(activeTicketId);
      if (threadRes.success && threadRes.messages) {
        setMessages(threadRes.messages as ChatMessage[]);
        scrollToBottom();
      }
      loadTickets();
    } else {
      toast.error(res.error || 'Failed to send message.');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSubject.trim()) {
      toast.error('Please enter a subject for your request.');
      return;
    }
    if (!createMessage.trim()) {
      toast.error('Please describe your issue or question.');
      return;
    }

    setCreating(true);
    const res = await createSupportTicket({
      name: createName.trim() || user?.name || 'User',
      email: createEmail.trim() || user?.email || '',
      subject: createSubject.trim(),
      priority: createPriority,
      message: createMessage.trim(),
      userId: user?.id,
    });
    setCreating(false);

    if (res.success && res.ticketId) {
      toast.success('Support request submitted!');
      setCreateSubject('');
      setCreateMessage('');
      setCreatePriority('medium');
      await loadTickets();
      openThread(res.ticketId);
    } else {
      toast.error(res.error || 'Failed to submit support request.');
    }
  };

  const handleEmailTranscript = async () => {
    if (!activeTicketId) return;
    setSendingTranscript(true);
    const res = await emailUserTicketTranscript(activeTicketId);
    setSendingTranscript(false);
    if (res.success) {
      toast.success(res.message || 'Full conversation transcript sent to your email!');
    } else {
      toast.error(res.error || 'Failed to email transcript.');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
          <Flame className="h-2.5 w-2.5 text-rose-400" />
          Urgent
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
          High
        </span>
      );
    }
    if (p === 'low') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
          Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">
        Medium
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] h-[720px] p-0 flex flex-col overflow-hidden bg-background border rounded-2xl">
        {/* Header Bar */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {view !== 'list' && tickets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setActiveTicketId(null);
                  loadTickets();
                }}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-1 shrink-0"
                title="Back to Tickets"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <LifeBuoy className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-foreground truncate">
                {view === 'thread'
                  ? activeTicket?.subject || `Ticket #${activeTicket?.ticketCode || activeTicketId?.slice(0, 8)}`
                  : view === 'create'
                  ? 'New Support Request'
                  : 'Customer Support Hub'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate">
                {view === 'thread'
                  ? `Ticket #${activeTicket?.ticketCode || activeTicketId?.slice(0, 8)} • ${activeTicket?.status.toUpperCase()}`
                  : 'Chat directly with the Tender Track 360 team'}
              </p>
            </div>
          </div>

          {view === 'thread' && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmailTranscript}
                disabled={sendingTranscript}
                className="h-8 text-xs gap-1.5 cursor-pointer"
                title="Send full chat history to your email"
              >
                {sendingTranscript ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                <span>Email Transcript</span>
              </Button>
            </div>
          )}

          {view === 'list' && (
            <Button
              size="sm"
              onClick={() => setView('create')}
              className="h-8 text-xs gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Request</span>
            </Button>
          )}
        </div>

        {/* View 1: Ticket List */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">No support requests yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Have a question, need assistance with a tender, or encountering an issue? Open a ticket to start a direct in-app chat with our team.
                </p>
                <Button
                  size="sm"
                  onClick={() => setView('create')}
                  className="gap-1.5 cursor-pointer mt-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Start Support Conversation</span>
                </Button>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  className="p-3.5 bg-card hover:bg-accent/40 border rounded-xl transition-all cursor-pointer space-y-2 group shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        #{t.ticketCode || `TICK-${t.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                      {getPriorityBadge(t.priority)}
                    </div>

                    {t.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold animate-pulse">
                        {t.unreadCount} new reply
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {t.subject || 'Support Request'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(t.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-primary transition-colors font-medium">
                      <MessageCircle className="h-3 w-3" />
                      <span>{t.messageCount} msg(s)</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* View 2: Chat Thread */}
        {view === 'thread' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
              {threadLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.senderType === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                        {isAdmin ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Tender Track Support
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">You</span>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm shadow-xs ${
                          isAdmin
                            ? 'bg-card border text-foreground rounded-tl-xs'
                            : 'bg-[#1a3a52] text-white rounded-tr-xs'
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

            {/* Input Composer */}
            <form
              onSubmit={handleSendReply}
              className="p-3 border-t bg-background flex items-center gap-2"
            >
              <textarea
                rows={1}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(e);
                  }
                }}
                placeholder="Type your message (supports @mentions, `code`, **bold**, URLs)..."
                className="flex-1 px-3 py-2 bg-muted/40 border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
              />

              <Button
                type="submit"
                size="sm"
                disabled={sending || !replyMessage.trim()}
                className="h-9 px-3 gap-1 cursor-pointer shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </div>
        )}

        {/* View 3: Create New Ticket Form */}
        {view === 'create' && (
          <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Your Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 bg-muted/40 border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Priority</label>
                <PrioritySelect
                  value={createPriority}
                  onValueChange={(val) => setCreatePriority(val)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Contact Email</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="name@company.co.za"
                required
                className="w-full px-3 py-2 bg-muted/40 border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Subject / Issue Summary</label>
              <input
                type="text"
                value={createSubject}
                onChange={(e) => setCreateSubject(e.target.value)}
                placeholder="e.g., Error uploading tender compliance document"
                required
                className="w-full px-3 py-2 bg-muted/40 border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                How can our support team help you?
              </label>
              <textarea
                rows={4}
                value={createMessage}
                onChange={(e) => setCreateMessage(e.target.value)}
                placeholder="Describe what you need help with (supports @mentions, `code`, **bold**)..."
                required
                className="w-full px-3 py-2 bg-muted/40 border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground resize-y"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {tickets.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setView('list')}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={creating || !createSubject.trim() || !createMessage.trim()}
                className="gap-2 cursor-pointer"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit & Open Chat</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
