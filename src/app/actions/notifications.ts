"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notification";

export async function fetchNotifications() {
  const user = await getCurrentUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(user.id, 15),
    getUnreadCount(user.id),
  ]);

  return { notifications, unreadCount };
}

export async function readNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await markAsRead(notificationId, user.id);
}

export async function readAllNotifications() {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllAsRead(user.id);
}
