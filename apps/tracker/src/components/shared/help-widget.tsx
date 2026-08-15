'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  MessageSquarePlus,
  HelpCircle,
  MessageCircle,
  Mail,
  Loader2,
  LifeBuoy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { submitFeedback } from '@/server/feedback';
import { getUserSupportTickets } from '@/server/support';
import { usePathname } from 'next/navigation';
import { CONTACT_INFO } from '@/lib/constants';
import { useSessionUser } from '@/lib/client-session-store';
import { TicketChatModal } from '../support/ticket-chat-drawer';

type DialogMode = 'feedback' | null;

export function HelpWidget() {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('other');

  const user = useSessionUser();

  // Feedback Form State
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');

  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkUnread();
  }, []);

  // Periodic unread check
  const checkUnread = async () => {
    try {
      const res = await getUserSupportTickets();
      if (res.success && typeof res.unreadTotal === 'number') {
        setUnreadCount(res.unreadTotal);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (user && !feedbackEmail) {
      setFeedbackEmail(user.email || '');
    }
  }, [user]);

  const handleFeedbackSubmit = () => {
    if (!feedbackMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback({
        message: feedbackMessage,
        type: feedbackType,
        url: pathname,
        email: feedbackEmail || undefined,
        userId: user?.id,
        name: user?.name || undefined,
      });

      if (result.success) {
        toast.success('Thank you for your feedback! Our team will review it.');
        setDialogMode(null);
        setFeedbackMessage('');
        if (!user) setFeedbackEmail('');
        setFeedbackType('other');
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    });
  };

  const whatsappMessage = encodeURIComponent(
    "Hi, I'm interested in Tender Track 360 and would like to know more."
  );

  if (!isMounted || pathname === '/support') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="relative h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105 cursor-pointer"
            >
              <HelpCircle className="h-8 w-8 text-primary-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Help & Support</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Help & Support Hub</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Support In-App Chat */}
            <DropdownMenuItem
              onSelect={() => {
                setChatOpen(true);
                setUnreadCount(0);
              }}
              className="cursor-pointer font-medium flex items-center justify-between"
            >
              <div className="flex items-center">
                <LifeBuoy className="mr-2 h-4 w-4 text-primary" />
                <span>Support & In-App Chat</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {unreadCount} new
                </span>
              )}
            </DropdownMenuItem>

            {/* Feedback */}
            <DropdownMenuItem
              onSelect={() => setDialogMode('feedback')}
              className="cursor-pointer"
            >
              <MessageSquarePlus className="mr-2 h-4 w-4 text-amber-500" />
              <span>Give Feedback</span>
            </DropdownMenuItem>

            {/* WhatsApp */}
            <DropdownMenuItem asChild>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp.replace('+', '')}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Chat on WhatsApp</span>
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Direct Email */}
            <DropdownMenuItem asChild>
              <a
                href="mailto:info@contact.tendertrack360.co.za?subject=Support%20Enquiry"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                <Mail className="mr-2 h-3.5 w-3.5" />
                <span>Email Support Team</span>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dedicated Feedback Dialog */}
      <Dialog
        open={dialogMode === 'feedback'}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Product Feedback</DialogTitle>
            <DialogDescription>
              Help us improve. Report a bug, suggest a feature, or share your thoughts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Feedback Category</Label>
              <Select
                value={feedbackType}
                onValueChange={(val: 'bug' | 'feature' | 'other') =>
                  setFeedbackType(val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="other">General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback-email">Email (Optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your@email.com"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Feedback Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you'd like to see improved..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleFeedbackSubmit}
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dedicated Support Chat & Thread Modal */}
      <TicketChatModal
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open);
          if (!open) checkUnread();
        }}
      />
    </>
  );
}
