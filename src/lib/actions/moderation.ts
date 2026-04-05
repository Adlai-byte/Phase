import { prisma } from "@/lib/prisma";

export async function flagBoardingHouse(houseId: string, reason: string) {
  const house = await prisma.boardingHouse.findUnique({ where: { id: houseId } });
  if (!house) return { success: false as const, error: "Boarding house not found" };

  await prisma.boardingHouse.update({
    where: { id: houseId },
    data: { flagged: true, flagReason: reason },
  });

  return { success: true as const };
}

export async function unflagBoardingHouse(houseId: string) {
  await prisma.boardingHouse.update({
    where: { id: houseId },
    data: { flagged: false, flagReason: null },
  });
  return { success: true as const };
}

export async function unpublishBoardingHouse(houseId: string) {
  await prisma.boardingHouse.update({
    where: { id: houseId },
    data: { published: false },
  });
  return { success: true as const };
}

export async function getModerationQueue() {
  return prisma.boardingHouse.findMany({
    where: { flagged: true },
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
