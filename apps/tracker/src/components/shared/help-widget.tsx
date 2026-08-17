"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, LifeBuoy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getUserSupportTickets } from "@/server/support";
import { usePathname } from "next/navigation";
import { TicketChatModal } from "../support/ticket-chat-drawer";
import { ProductFeedbackModal } from "../feedback/ProductFeedbackModal";

export function HelpWidget() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkUnread();

    const handleUpdate = () => {
      checkUnread();
    };
    window.addEventListener("support-count-updated", handleUpdate);
    return () => {
      window.removeEventListener("support-count-updated", handleUpdate);
    };
  }, []);

  // Periodic unread check
  const checkUnread = async () => {
    try {
      const res = await getUserSupportTickets();
      if (res.success && typeof res.unreadTotal === "number") {
        setUnreadCount(res.unreadTotal);
      }
    } catch {
      // Non-blocking
    }
  };

  if (!isMounted || pathname === "/support") {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="relative h-11 px-4 sm:px-5 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2.5 font-bold transition-all hover:scale-105 cursor-pointer border border-primary/40 shadow-primary/30 text-sm"
              aria-label="Support and Help Menu"
            >
              <LifeBuoy
                className="h-4 w-4 shrink-0 text-primary-foreground"
                aria-hidden="true"
              />
              <span>Support</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 p-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl space-y-1"
          >
            {/* Support In-App Chat */}
            <DropdownMenuItem
              onSelect={() => {
                setChatOpen(true);
                setUnreadCount(0);
              }}
              className="cursor-pointer font-bold py-2.5 px-3 rounded-xl flex items-center justify-between hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="h-4 w-4 text-primary" />
                <span className="text-foreground">Support Concierge</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                  {unreadCount} new
                </span>
              )}
            </DropdownMenuItem>

            {/* In-App Feedback */}
            <DropdownMenuItem
              onSelect={() => setFeedbackOpen(true)}
              className="cursor-pointer py-2.5 px-3 rounded-xl flex items-center gap-2.5 text-muted-foreground hover:text-foreground text-xs font-semibold hover:bg-muted/40 transition-colors"
            >
              <MessageSquarePlus className="h-4 w-4 text-amber-400" />
              <span>Send Product Feedback</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacious Product Feedback Modal */}
      <ProductFeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />

      {/* Support In-App Concierge Chat Modal */}
      <TicketChatModal open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
