import { prisma } from "@/lib/prisma";

export async function verifyOwner(ownerId: string) {
  const user = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!user) return { success: false as const, error: "User not found" };
  if (user.role !== "OWNER") return { success: false as const, error: "Can only verify owner accounts" };

  await prisma.user.update({
    where: { id: ownerId },
    data: { verified: true },
  });

  return { success: true as const };
}

export async function rejectOwner(ownerId: string) {
  const user = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!user) return { success: false as const, error: "User not found" };
  if (user.verified) return { success: false as const, error: "Cannot reject a verified owner" };

  await prisma.user.delete({ where: { id: ownerId } });
  return { success: true as const };
}

export async function getAllOwners() {
  return prisma.user.findMany({
    where: { role: "OWNER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      verified: true,
      createdAt: true,
      subscription: { select: { plan: true } },
      boardingHouses: { select: { id: true } },
      _count: { select: { boardingHouses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlatformOverview() {
  const [totalOwners, verifiedOwners, totalHouses, totalTenants, totalRooms] =
    await Promise.all([
      prisma.user.count({ where: { role: "OWNER" } }),
      prisma.user.count({ where: { role: "OWNER", verified: true } }),
      prisma.boardingHouse.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.room.count(),
    ]);

  const revenue = await prisma.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  return {
    totalOwners,
    verifiedOwners,
    pendingVerifications: totalOwners - verifiedOwners,
    totalBoardingHouses: totalHouses,
    totalTenants,
    totalRooms,
    totalRevenue: revenue._sum.amount || 0,
  };
}
