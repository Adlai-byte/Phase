"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "tenant" | "room" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  link: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const user = await getCurrentUser();
  if (!user || !query || query.length < 2) return [];

  const houses = await prisma.boardingHouse.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const houseIds = houses.map((h) => h.id);
  if (houseIds.length === 0) return [];

  const results: SearchResult[] = [];

  const tenants = await prisma.tenant.findMany({
    where: {
      boardingHouseId: { in: houseIds },
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ],
    },
    include: { room: { select: { number: true } } },
    take: 5,
  });

  for (const t of tenants) {
    results.push({
      type: "tenant",
      id: t.id,
      title: t.name,
      subtitle: t.room ? `Room ${t.room.number}` : "Unassigned",
      link: "/dashboard/tenants",
    });
  }

  const rooms = await prisma.room.findMany({
    where: {
      boardingHouseId: { in: houseIds },
      number: { contains: query },
    },
    include: { tenants: { where: { status: "ACTIVE" }, select: { name: true }, take: 1 } },
    take: 5,
  });

  for (const r of rooms) {
    results.push({
      type: "room",
      id: r.id,
      title: `Room ${r.number}`,
      subtitle: r.tenants[0]?.name || r.status,
      link: "/dashboard/properties",
    });
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      boardingHouseId: { in: houseIds },
      invoiceNumber: { contains: query },
    },
    include: { tenant: { select: { name: true } } },
    take: 5,
  });

  for (const i of invoices) {
    results.push({
      type: "invoice",
      id: i.id,
      title: i.invoiceNumber,
      subtitle: `${i.tenant.name} — ${i.status}`,
      link: "/dashboard/invoices",
    });
  }

  return results.slice(0, 10);
}
