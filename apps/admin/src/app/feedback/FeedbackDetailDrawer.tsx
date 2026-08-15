'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import StatusBadge from '@/components/StatusBadge';
import {
  Mail,
  User,
  ExternalLink,
  Copy,
  Check,
  Send,
  Loader2,
  Calendar,
  MessageSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { FeedbackWithUser } from '@/lib/admin-queries';
import { sendFeedbackReplyAction } from './actions';

type Props = {
  feedback: FeedbackWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeedbackDetailDrawer({ feedback, open, onOpenChange }: Props) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const defaultSub = `Re: ${
        feedback.type === 'bug'
          ? 'Bug Report'
          : feedback.type === 'feature'
          ? 'Feature Request'
          : 'Feedback'
      } — Tender Track 360`;
      setSubject(defaultSub);
      setResult(null);
      setReplyMessage('');
    }
  }, [feedback?.id, feedback?.type]);

  if (!feedback) return null;

  const defaultSubject = `Re: ${
    feedback.type === 'bug'
      ? 'Bug Report'
      : feedback.type === 'feature'
      ? 'Feature Request'
      : 'Feedback'
  } — Tender Track 360`;

  const handleCopyEmail = () => {
    if (feedback.email) {
      navigator.clipboard.writeText(feedback.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(feedback.message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.email) return;

    setSending(true);
    setResult(null);

    const res = await sendFeedbackReplyAction({
      feedbackId: feedback.id,
      toEmail: feedback.email,
      recipientName: feedback.name || feedback.userName || undefined,
      subject: subject.trim() || defaultSubject,
      replyMessage: replyMessage.trim(),
    });

    setSending(false);
    if (res.success) {
      setResult({ success: true, message: res.message || 'Response sent successfully!' });
      setReplyMessage('');
    } else {
      setResult({ success: false, message: res.error || 'Failed to send response.' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 p-0 flex flex-col h-full overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={feedback.type} />
            <span className="text-xs text-zinc-500 font-mono">ID: {feedback.id.slice(0, 8)}</span>
          </div>
          <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-400" />
            <span>
              {feedback.type === 'bug'
                ? 'Bug Report'
                : feedback.type === 'feature'
                ? 'Feature Request'
                : 'User Feedback'}
            </span>
          </SheetTitle>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              Received on{' '}
              {new Date(feedback.createdAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Submitter Info Card */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Submitter Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Name</div>
                <div className="font-medium text-white flex items-center gap-1.5 mt-0.5">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{feedback.name || feedback.userName || 'Anonymous'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Email Address</div>
                <div className="font-medium text-white flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  {feedback.email ? (
                    <div className="flex items-center gap-2">
                      <span className="truncate">{feedback.email}</span>
                      <button
                        onClick={handleCopyEmail}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Copy email"
                      >
                        {copiedEmail ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-500 italic">None provided</span>
                  )}
                </div>
              </div>
            </div>

            {feedback.url && (
              <div className="pt-2 border-t border-zinc-800/60">
                <div className="text-xs text-zinc-500">Source Page URL</div>
                <a
                  href={feedback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 mt-0.5 truncate"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{feedback.url}</span>
                </a>
              </div>
            )}
          </div>

          {/* Full Feedback Message Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Full Feedback Message
              </div>
              <button
                onClick={handleCopyMessage}
                className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap select-text font-sans">
              {feedback.message}
            </div>
          </div>

          {/* Reply Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Respond to Submitter</span>
              </div>
              {feedback.email && (
                <a
                  href={`mailto:${feedback.email}?subject=${encodeURIComponent(
                    defaultSubject
                  )}`}
                  className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  <span>Open in Mail App</span>
                </a>
              )}
            </div>

            {feedback.email ? (
              <form
                onSubmit={handleSendReply}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3"
              >
                {result && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium ${
                      result.success
                        ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/50 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {result.message}
                  </div>
                )}

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={defaultSubject}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">
                    Your Message to {feedback.name || feedback.email}
                  </label>
                  <textarea
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Write a response thanking the user or providing an update..."
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 resize-y"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-500">
                    Sending to <strong className="text-zinc-400">{feedback.email}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={sending || !replyMessage.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs text-zinc-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-zinc-600 shrink-0" />
                <span>
                  The submitter did not provide an email address, so an automated email reply cannot be dispatched.
                </span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
