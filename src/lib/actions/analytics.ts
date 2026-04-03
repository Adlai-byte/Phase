import { prisma } from "@/lib/prisma";

export async function getRevenueByMonth(boardingHouseId: string, months: number) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // Single query for all paid invoices in the range
  const invoices = await prisma.invoice.findMany({
    where: {
      boardingHouseId,
      status: "PAID",
      paidDate: { gte: rangeStart },
    },
    select: { amount: true, paidDate: true },
  });

  // Build month buckets
  const revenueMap = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.paidDate) continue;
    const key = `${inv.paidDate.getFullYear()}-${String(inv.paidDate.getMonth() + 1).padStart(2, "0")}`;
    revenueMap.set(key, (revenueMap.get(key) || 0) + inv.amount);
  }

  const results: { month: string; label: string; revenue: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    results.push({
      month: key,
      label: date.toLocaleString("en-US", { month: "short" }),
      revenue: revenueMap.get(key) || 0,
    });
  }

  return results;
}

export async function getOccupancyStats(boardingHouseId: string) {
  const rooms = await prisma.room.findMany({
    where: { boardingHouseId },
    select: { status: true },
  });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const maintenanceRooms = rooms.filter((r) => r.status === "MAINTENANCE").length;

  return {
    totalRooms,
    occupiedRooms,
    availableRooms,
    maintenanceRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
  };
}

export async function getOwnerDashboardStats(ownerId: string) {
  const houses = await prisma.boardingHouse.findMany({
    where: { ownerId },
    select: { id: true },
  });
  const houseIds = houses.map((h) => h.id);

  if (houseIds.length === 0) {
    return {
      totalTenants: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
    };
  }

  const [tenantCount, rooms, paidSum, pendingCount] = await Promise.all([
    prisma.tenant.count({
      where: { boardingHouseId: { in: houseIds }, status: "ACTIVE" },
    }),
    prisma.room.findMany({
      where: { boardingHouseId: { in: houseIds } },
      select: { status: true },
    }),
    prisma.invoice.aggregate({
      where: { boardingHouseId: { in: houseIds }, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: { boardingHouseId: { in: houseIds }, status: "PENDING" },
    }),
  ]);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;

  return {
    totalTenants: tenantCount,
    totalRooms,
    occupiedRooms,
    availableRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    totalRevenue: paidSum._sum.amount || 0,
    pendingInvoices: pendingCount,
  };
}
