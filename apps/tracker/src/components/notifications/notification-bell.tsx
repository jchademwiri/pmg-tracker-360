'use client';

import { useState, useTransition } from 'react';
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  markAllNotificationsRead,
  markNotificationDetail,
} from '@/server/notifications';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  link?: string | null;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  organizationId: string;
}

export function NotificationBell({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
  organizationId,
}: NotificationBellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Optimistic UI could be implemented here, but for MVP simple server refresh is safer
  // Actually, for instant feedback, we can maintain local state synced with props but modifying on read
  // But props come from server component layout which refreshes on router.refresh().

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await markNotificationDetail(organizationId, id);
      // router.refresh(); // Implicit via server action revalidatePath, but nice to ensure
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead(organizationId);
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {initialUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
            >
              {initialUnreadCount > 9 ? '9+' : initialUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {initialUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {initialNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {initialNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !notification.read && 'bg-muted/50'
                  )}
                  onSelect={(e) => {
                    if (notification.link) {
                      router.push(notification.link);
                    }
                    // If not read, read it
                    if (!notification.read) {
                      handleMarkAsRead(
                        notification.id,
                        e as unknown as React.MouseEvent
                      );
                    }
                  }}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      {getIcon(notification.type)}
                      <span>{notification.title}</span>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <span className="sr-only">Mark Read</span>
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground w-full text-right mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
