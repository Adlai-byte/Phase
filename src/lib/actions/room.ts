import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createRoomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  floor: z.number().int().min(1).default(1),
  capacity: z.number().int().min(1).default(1),
  monthlyRate: z.number().positive("Monthly rate must be positive"),
  hasAircon: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasBathroom: z.boolean().default(false),
  electricityIncluded: z.boolean().default(false),
  amenities: z.string().optional(),
  boardingHouseId: z.string(),
});

export async function createRoom(input: z.infer<typeof createRoomSchema>) {
  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { boardingHouseId, ...data } = parsed.data;

  const existing = await prisma.room.findFirst({
    where: { boardingHouseId, number: data.number },
  });
  if (existing) {
    return { success: false as const, error: `Room ${data.number} already exists in this property` };
  }

  const room = await prisma.room.create({
    data: { ...data, status: "AVAILABLE", boardingHouseId },
  });

  return { success: true as const, room };
}

export async function getRooms(boardingHouseId: string) {
  return prisma.room.findMany({
    where: { boardingHouseId },
    include: {
      tenants: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { number: "asc" },
  });
}

const updateRoomSchema = z.object({
  id: z.string(),
  number: z.string().min(1).optional(),
  floor: z.number().int().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  monthlyRate: z.number().positive().optional(),
  hasAircon: z.boolean().optional(),
  hasWifi: z.boolean().optional(),
  hasBathroom: z.boolean().optional(),
  electricityIncluded: z.boolean().optional(),
});

export async function updateRoom(input: z.infer<typeof updateRoomSchema>) {
  const parsed = updateRoomSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { id, ...data } = parsed.data;
  const room = await prisma.room.update({ where: { id }, data });
  return { success: true as const, room };
}

const validStatuses = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"] as const;

export async function updateRoomStatus(roomId: string, status: string) {
  if (!validStatuses.includes(status as any)) {
    return { success: false as const, error: "Invalid room status" };
  }

  const room = await prisma.room.update({
    where: { id: roomId },
    data: { status },
  });

  return { success: true as const, room };
}
