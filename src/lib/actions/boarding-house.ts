import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  type: z.enum(["ALL_FEMALE", "ALL_MALE", "MIXED"]),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  hasCurfew: z.boolean().optional(),
  curfewTime: z.string().optional(),
  restrictions: z.array(z.string()).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  ownerId: z.string(),
});

type CreateInput = z.infer<typeof createSchema>;

export async function createBoardingHouse(input: CreateInput) {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { ownerId, amenities, restrictions, ...data } = parsed.data;

  const boardingHouse = await prisma.boardingHouse.create({
    data: {
      ...data,
      city: "Mati City",
      amenities: amenities ? JSON.stringify(amenities) : null,
      restrictions: restrictions ? JSON.stringify(restrictions) : null,
      published: false,
      verified: false,
      ownerId,
    },
  });

  return { success: true as const, boardingHouse };
}

export async function getOwnerBoardingHouses(ownerId: string) {
  const houses = await prisma.boardingHouse.findMany({
    where: { ownerId },
    include: {
      rooms: { select: { id: true, status: true } },
      tenants: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return houses.map((h) => ({
    ...h,
    totalRooms: h.rooms.length,
    occupiedRooms: h.rooms.filter((r) => r.status === "OCCUPIED").length,
    availableRooms: h.rooms.filter((r) => r.status === "AVAILABLE").length,
    activeTenants: h.tenants.length,
    amenities: h.amenities ? JSON.parse(h.amenities) : [],
    rooms: undefined,
    tenants: undefined,
  }));
}

export async function getBoardingHouseById(id: string) {
  const house = await prisma.boardingHouse.findUnique({
    where: { id },
    include: {
      rooms: true,
      tenants: { include: { room: true } },
      owner: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!house) return null;

  return {
    ...house,
    amenities: house.amenities ? JSON.parse(house.amenities) : [],
    restrictions: house.restrictions ? JSON.parse(house.restrictions) : [],
  };
}

const updateSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  type: z.enum(["ALL_FEMALE", "ALL_MALE", "MIXED"]).optional(),
  description: z.string().optional(),
  hasCurfew: z.boolean().optional(),
  curfewTime: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  published: z.boolean().optional(),
});

export async function updateBoardingHouse(input: z.infer<typeof updateSchema>) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { id, ownerId, amenities, restrictions, ...data } = parsed.data;

  const house = await prisma.boardingHouse.findUnique({ where: { id } });
  if (!house || house.ownerId !== ownerId) {
    return { success: false as const, error: "No permission to update this property" };
  }

  const boardingHouse = await prisma.boardingHouse.update({
    where: { id },
    data: {
      ...data,
      ...(amenities !== undefined && { amenities: JSON.stringify(amenities) }),
      ...(restrictions !== undefined && { restrictions: JSON.stringify(restrictions) }),
    },
  });

  return { success: true as const, boardingHouse };
}

