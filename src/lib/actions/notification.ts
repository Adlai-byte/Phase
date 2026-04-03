import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || "INFO",
      link: input.link || null,
    },
  });
}

export async function getNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string, userId?: string) {
  const where: Record<string, unknown> = { id: notificationId };
  if (userId) where.userId = userId;
  return prisma.notification.update({
    where,
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return result.count;
}
