'use server';

import { db } from '@/db';
import { notification } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

// Get notifications for the current user
export async function getNotifications(
  organizationId: string,
  limit: number = 20
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return {
        success: false,
        error: 'Unauthorized',
        notifications: [],
        unreadCount: 0,
      };
    }

    const userId = session.user.id;

    const notifications = await db
      .select()
      .from(notification)
      .where(
        and(
          eq(notification.organizationId, organizationId),
          eq(notification.userId, userId)
        )
      )
      .orderBy(desc(notification.createdAt))
      .limit(limit);

    // Count unread
    const unreadResult = await db.query.notification.findMany({
      where: and(
        eq(notification.organizationId, organizationId),
        eq(notification.userId, userId),
        eq(notification.read, false)
      ),
    });
    const unreadCount = unreadResult.length;

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: 'Failed to fetch notifications',
      notifications: [],
      unreadCount: 0,
    };
  }
}

// Mark a notification as read
export async function markNotificationDetail(
  organizationId: string,
  notificationId: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.id, notificationId),
          eq(notification.userId, session.user.id)
        )
      );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification read:', error);
    return { success: false, error: 'Failed' };
  }
}

// Mark all as read
export async function markAllNotificationsRead(organizationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.organizationId, organizationId),
          eq(notification.userId, session.user.id),
          eq(notification.read, false)
        )
      );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return { success: false, error: 'Failed' };
  }
}

// System function to create notification (internal use)
export async function createNotification({
  userId,
  organizationId,
  title,
  message,
  type = 'info',
  link,
}: {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    await db.insert(notification).values({
      id: nanoid(),
      userId,
      organizationId,
      title,
      message,
      type,
      link,
      read: false,
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed' };
  }
}
