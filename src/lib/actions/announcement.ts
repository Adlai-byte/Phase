import { prisma } from "@/lib/prisma";

type AnnouncementInput = {
  title: string;
  message: string;
  type?: string;
  targetPlan?: string;
  targetUserId?: string;
  createdById: string;
};

export async function createAnnouncement(input: AnnouncementInput) {
  return prisma.announcement.create({
    data: {
      title: input.title,
      message: input.message,
      type: input.type || "INFO",
      targetPlan: input.targetPlan || null,
      targetUserId: input.targetUserId || null,
      createdById: input.createdById,
    },
  });
}

export async function getAnnouncements(userId: string) {
  // Get user's subscription plan
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const userPlan = sub?.plan || null;

  const announcements = await prisma.announcement.findMany({
    where: {
      published: true,
      OR: [
        { targetPlan: null, targetUserId: null },
        { targetUserId: userId },
        ...(userPlan ? [{ targetPlan: userPlan }] : []),
      ],
    },
    include: {
      reads: { where: { userId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    type: a.type,
    createdAt: a.createdAt,
    isRead: a.reads.length > 0,
  }));
}

export async function markAnnouncementRead(announcementId: string, userId: string) {
  await prisma.announcementRead.upsert({
    where: { userId_announcementId: { userId, announcementId } },
    create: { userId, announcementId },
    update: {},
  });
}

export async function getUnreadAnnouncementCount(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const userPlan = sub?.plan || null;

  const total = await prisma.announcement.count({
    where: {
      published: true,
      OR: [
        { targetPlan: null, targetUserId: null },
        { targetUserId: userId },
        ...(userPlan ? [{ targetPlan: userPlan }] : []),
      ],
    },
  });

  const read = await prisma.announcementRead.count({ where: { userId } });
  return Math.max(0, total - read);
}
