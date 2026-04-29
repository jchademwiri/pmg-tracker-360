'use server';

import { db } from '@pmg/db';
import { notification } from '@pmg/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

// Auth stub — uses stub user ID until Phase 4
const STUB_USER_ID = 'stub-user-id';

export async function getNotifications(organizationId: string, limit = 20) {
  try {
    const notifications = await db
      .select()
      .from(notification)
      .where(and(eq(notification.organizationId, organizationId), eq(notification.userId, STUB_USER_ID)))
      .orderBy(desc(notification.createdAt))
      .limit(limit);

    const unreadCount = notifications.filter((n) => !n.read).length;
    return { success: true, notifications, unreadCount };
  } catch (error) {
    return { success: false, error: 'Failed to fetch notifications', notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationDetail(organizationId: string, notificationId: string) {
  try {
    await db.update(notification).set({ read: true }).where(and(eq(notification.id, notificationId), eq(notification.userId, STUB_USER_ID)));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed' };
  }
}

export async function markAllNotificationsRead(organizationId: string) {
  try {
    await db.update(notification).set({ read: true }).where(and(eq(notification.organizationId, organizationId), eq(notification.userId, STUB_USER_ID), eq(notification.read, false)));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed' };
  }
}

export async function createNotification({ userId, organizationId, title, message, type = 'info', link }: {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    await db.insert(notification).values({ id: nanoid(), userId, organizationId, title, message, type, link, read: false });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed' };
  }
}
