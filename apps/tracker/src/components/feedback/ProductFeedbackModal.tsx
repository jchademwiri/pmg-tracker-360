'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  Send,
  Globe,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '@/server/feedback';
import { usePathname } from 'next/navigation';
import { useSessionUser } from '@/lib/client-session-store';
import { authClient } from '@/lib/auth-client';

interface ProductFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductFeedbackModal({
  open,
  onOpenChange,
}: ProductFeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackHp, setFeedbackHp] = useState('');
  const [formMountedAt, setFormMountedAt] = useState<number>(() => Date.now());
  const [submitted, setSubmitted] = useState(false);

  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  
  // Combine both client store and Better Auth session
  const storeUser = useSessionUser();
  const { data: session } = authClient.useSession();
  const currentUser = storeUser || session?.user;

  useEffect(() => {
    if (open) {
      setFormMountedAt(Date.now());
      if (currentUser) {
        if (currentUser.name) setFeedbackName(currentUser.name);
        if (currentUser.email) setFeedbackEmail(currentUser.email);
      }
    }
  }, [currentUser, open]);

  const handleReset = () => {
    setFeedbackMessage('');
    setFeedbackType('feature');
    setFeedbackHp('');
    setSubmitted(false);
    if (!currentUser) {
      setFeedbackName('');
      setFeedbackEmail('');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  };

  const handleSubmit = () => {
    if (!feedbackMessage.trim()) {
      toast.error('Please provide details for your feedback.');
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback({
        message: feedbackMessage.trim(),
        type: feedbackType,
        url: pathname,
        email: feedbackEmail.trim() || undefined,
        name: feedbackName.trim() || undefined,
        userId: currentUser?.id,
        honeypot: feedbackHp,
        formMountedAt,
      });

      if (result.success) {
        setSubmitted(true);
        toast.success('Thank you! Your feedback has been received.');
      } else {
        toast.error(result.error || 'Failed to submit feedback.');
      }
    });
  };

  const categories = [
    {
      id: 'feature' as const,
      label: 'Feature Request',
      desc: 'Suggest a new tool or workflow improvement',
      icon: Lightbulb,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/15 border-amber-500/50',
    },
    {
      id: 'bug' as const,
      label: 'Bug Report',
      desc: 'Report something that is broken or unexpected',
      icon: Bug,
      color: 'text-rose-400',
      activeBg: 'bg-rose-500/15 border-rose-500/50',
    },
    {
      id: 'other' as const,
      label: 'General Feedback',
      desc: 'Share your thoughts on design or usability',
      icon: MessageSquare,
      color: 'text-sky-400',
      activeBg: 'bg-sky-500/15 border-sky-500/50',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
        {!submitted ? (
          <div className="space-y-6">
            {/* Header */}
            <DialogHeader className="text-left space-y-2 pr-10">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Product Improvement Desk</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60">
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  <span>{pathname}</span>
                </span>
              </div>
              <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight">
                Send Product Feedback
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Your direct suggestions help shape Tender Track 360. Our product and engineering team reviews every submission.
              </DialogDescription>
            </DialogHeader>

            {/* Category Selector Grid */}
            <div className="space-y-2 text-left">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Select Category
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = feedbackType === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackType(cat.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? `${cat.activeBg} shadow-sm border-2`
                          : 'bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`h-5 w-5 ${cat.color}`} aria-hidden="true" />
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {cat.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {cat.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sender Identity (Auto-filled if logged in) */}
            <div className="space-y-2 text-left">
              {/* Honeypot field (hidden from humans, caught by bots) */}
              <div
                aria-hidden="true"
                className="opacity-0 absolute -z-50 select-none pointer-events-none h-0 w-0 overflow-hidden"
                tabIndex={-1}
              >
                <label htmlFor="fb-company-hp">Leave this field blank</label>
                <input
                  id="fb-company-hp"
                  type="text"
                  name="fb_company_hp"
                  value={feedbackHp}
                  onChange={(e) => setFeedbackHp(e.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

              {currentUser && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Logged in as <strong>{currentUser.name || currentUser.email}</strong> (Details auto-filled)</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fb-name" className="text-xs font-bold text-foreground">
                    Your Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="fb-name"
                      value={feedbackName}
                      onChange={(e) => setFeedbackName(e.target.value)}
                      placeholder="e.g. Sipho Ndlovu"
                      className="pl-9 h-10 rounded-xl bg-muted/20 border-border/70 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fb-email" className="text-xs font-bold text-foreground">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="fb-email"
                      type="email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="name@company.co.za"
                      className="pl-9 h-10 rounded-xl bg-muted/20 border-border/70 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="fb-message" className="text-xs font-bold text-foreground">
                  Detailed Feedback & Suggestions
                </Label>
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                  {feedbackMessage.length} / 1000
                </span>
              </div>
              <Textarea
                id="fb-message"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder={
                  feedbackType === 'bug'
                    ? 'What happened? Steps to reproduce the issue...'
                    : feedbackType === 'feature'
                    ? 'Describe the feature you need and how it would improve your tender or PO workflow...'
                    : 'Share your thoughts, suggestions, or overall experience with Tender Track 360...'
                }
                rows={5}
                maxLength={1000}
                className="rounded-2xl bg-muted/20 border-border/70 text-sm p-4 leading-relaxed focus:border-primary resize-none"
              />
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground text-left hidden sm:block">
                We respect your feedback and review every submission.
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                  className="w-full sm:w-auto h-10 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !feedbackMessage.trim()}
                  className="w-full sm:w-auto h-10 rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        ) : (
          /* Success View */
          <div className="py-8 text-center space-y-5 animate-in fade-in-50 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-foreground">
                Feedback Received!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for helping us make Tender Track 360 better. Our engineering and design team has been notified.
              </p>
            </div>
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleClose}
                className="h-10 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
