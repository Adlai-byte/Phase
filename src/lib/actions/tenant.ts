import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  tag: z.string().optional(),
  boardingHouseId: z.string(),
  roomId: z.string().optional(),
});

export async function createTenant(input: z.infer<typeof createTenantSchema>) {
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { boardingHouseId, roomId, ...data } = parsed.data;

  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        ...data,
        email: data.email || null,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone: data.emergencyPhone || null,
        tag: data.tag || null,
        moveInDate: new Date(),
        status: "ACTIVE",
        boardingHouseId,
        roomId: roomId || null,
      },
    });
    if (roomId) {
      await tx.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED" },
      });
    }
    return created;
  });

  return { success: true as const, tenant };
}

export async function getTenants(
  boardingHouseId: string,
  filters?: { status?: string; search?: string }
) {
  const where: Record<string, unknown> = { boardingHouseId };
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }

  return prisma.tenant.findMany({
    where,
    include: {
      room: { select: { id: true, number: true, floor: true, monthlyRate: true } },
    },
    orderBy: { name: "asc" },
  });
}

const updateTenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
});

export async function updateTenant(input: z.infer<typeof updateTenantSchema>) {
  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { id, ...data } = parsed.data;

  // If setting inactive, free the room and unlink tenant
  if (data.status === "INACTIVE") {
    const tenant = await prisma.$transaction(async (tx) => {
      const current = await tx.tenant.findUnique({ where: { id } });
      if (current?.roomId) {
        await tx.room.update({
          where: { id: current.roomId },
          data: { status: "AVAILABLE" },
        });
      }
      return tx.tenant.update({
        where: { id },
        data: { ...data, roomId: null, moveOutDate: new Date() },
      });
    });
    return { success: true as const, tenant };
  }

  const tenant = await prisma.tenant.update({ where: { id }, data });
  return { success: true as const, tenant };
}

export async function assignTenantToRoom(tenantId: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.status !== "AVAILABLE") {
    return { success: false as const, error: "Room is not available for assignment" };
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const updated = await tx.tenant.update({
      where: { id: tenantId },
      data: { roomId },
    });
    await tx.room.update({
      where: { id: roomId },
      data: { status: "OCCUPIED" },
    });
    return updated;
  });

  return { success: true as const, tenant };
}
