import { prisma } from "@/lib/prisma";

type SearchFilters = {
  type?: string;
  maxPrice?: number;
  search?: string;
};

export async function searchBoardingHouses(filters: SearchFilters) {
  const where: Record<string, unknown> = { published: true, verified: true };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { address: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  const houses = await prisma.boardingHouse.findMany({
    where,
    include: {
      rooms: { select: { id: true, status: true, monthlyRate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let results = houses.map((h) => {
    const availableRooms = h.rooms.filter((r) => r.status === "AVAILABLE");
    const rates = h.rooms.map((r) => r.monthlyRate);
    const minRate = rates.length > 0 ? Math.min(...rates) : 0;

    return {
      id: h.id,
      name: h.name,
      address: h.address,
      city: h.city,
      type: h.type,
      description: h.description,
      coverImage: h.coverImage,
      hasCurfew: h.hasCurfew,
      amenities: h.amenities ? JSON.parse(h.amenities) : [],
      totalRooms: h.rooms.length,
      availableRooms: availableRooms.length,
      minRate,
      verified: h.verified,
    };
  });

  // Client-side price filter (based on min room rate)
  if (filters.maxPrice) {
    results = results.filter((h) => h.minRate > 0 && h.minRate <= filters.maxPrice!);
  }

  return results;
}
