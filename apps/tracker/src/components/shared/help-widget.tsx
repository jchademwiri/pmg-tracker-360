'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  MessageSquarePlus,
  HelpCircle,
  MessageCircle,
  Mail,
  Loader2,
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
import { createSupportTicket } from '@/server/support';
import { usePathname } from 'next/navigation';
import { CONTACT_INFO } from '@/lib/constants';
import { authClient } from '@/lib/auth-client';

type DialogMode = 'feedback' | 'support' | null;

export function HelpWidget() {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>(
    'other'
  );

  // Session State
  const { data: session } = authClient.useSession();

  // Feedback Form State
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');

  // Support Form State
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  // Client-side only rendering to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update form defaults when session loads
  useEffect(() => {
    if (session?.user) {
      if (!feedbackEmail) setFeedbackEmail(session.user.email || '');
      if (!supportEmail) setSupportEmail(session.user.email || '');
      if (!supportName) setSupportName(session.user.name || '');
    }
  }, [session]);

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
        userId: session?.user?.id,
        name: session?.user?.name || undefined,
      });

      if (result.success) {
        toast.success('Thank you for your feedback!');
        setDialogMode(null);
        setFeedbackMessage('');
        // Don't clear email if logged in
        if (!session?.user) setFeedbackEmail('');
        setFeedbackType('other');
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    });
  };

  const handleSupportSubmit = () => {
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      const result = await createSupportTicket({
        name: supportName,
        email: supportEmail,
        message: supportMessage,
        userId: session?.user?.id,
      });

      if (result.success) {
        toast.success('Support ticket created! We will contact you shortly.');
        setDialogMode(null);
        // Don't clear name/email if logged in
        if (!session?.user) {
          setSupportName('');
          setSupportEmail('');
        }
        setSupportMessage('');
      } else {
        toast.error(result.error || 'Failed to submit support request');
      }
    });
  };

  const whatsappMessage = encodeURIComponent(
    "Hi, I'm interested in Tender Track 360 and would like to know more."
  );

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
            >
              <HelpCircle className="h-8 w-8 text-primary-foreground" />
              <span className="sr-only">Help & Support</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDialogMode('feedback')}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              <span>Give Feedback</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp.replace('+', '')}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogMode('support')}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Contact Support</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feedback Dialog */}
      <Dialog
        open={dialogMode === 'feedback'}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Help us improve. Report a bug, suggest a feature, or just say hi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Feedback Type</Label>
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
                  <SelectItem value="bug">Report a Bug</SelectItem>
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
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
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
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog
        open={dialogMode === 'support'}
        onOpenChange={(open) => !open && setDialogMode(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Need help? Fill out the form below and our team will get back to
              you directly via email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="support-name">Name</Label>
              <Input
                id="support-name"
                placeholder="Your Name"
                value={supportName}
                onChange={(e) => setSupportName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-email">Email</Label>
              <Input
                id="support-email"
                type="email"
                placeholder="your@email.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-message">How can we help?</Label>
              <Textarea
                id="support-message"
                placeholder="Describe your issue..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSupportSubmit}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
