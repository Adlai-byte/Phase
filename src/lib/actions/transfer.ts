import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createTransferSchema = z.object({
  tenantId: z.string(),
  fromRoomId: z.string(),
  toRoomId: z.string(),
  reason: z.string().optional(),
  transferDate: z.date().optional(),
});

export async function createTransfer(input: z.infer<typeof createTransferSchema>) {
  const parsed = createTransferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { tenantId, fromRoomId, toRoomId, reason, transferDate } = parsed.data;

  if (fromRoomId === toRoomId) {
    return { success: false as const, error: "Cannot transfer to the same room" };
  }

  const toRoom = await prisma.room.findUnique({ where: { id: toRoomId } });
  if (!toRoom || toRoom.status !== "AVAILABLE") {
    return { success: false as const, error: "Target room is not available" };
  }

  const transfer = await prisma.roomTransfer.create({
    data: {
      tenantId,
      fromRoomId,
      toRoomId,
      reason: reason || null,
      status: "PENDING",
      transferDate: transferDate || null,
    },
  });

  return { success: true as const, transfer };
}

export async function approveTransfer(transferId: string) {
  const transfer = await prisma.roomTransfer.findUnique({ where: { id: transferId } });
  if (!transfer) {
    return { success: false as const, error: "Transfer not found" };
  }
  if (transfer.status !== "PENDING") {
    return { success: false as const, error: "Transfer is not in pending status" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: transfer.tenantId },
      data: { roomId: transfer.toRoomId },
    });
    await tx.room.update({
      where: { id: transfer.fromRoomId },
      data: { status: "AVAILABLE" },
    });
    await tx.room.update({
      where: { id: transfer.toRoomId },
      data: { status: "OCCUPIED" },
    });
    return tx.roomTransfer.update({
      where: { id: transferId },
      data: { status: "COMPLETED", transferDate: new Date() },
    });
  });

  return { success: true as const, transfer: updated };
}

export async function cancelTransfer(transferId: string) {
  const transfer = await prisma.roomTransfer.findUnique({ where: { id: transferId } });
  if (!transfer) {
    return { success: false as const, error: "Transfer not found" };
  }
  if (transfer.status !== "PENDING") {
    return { success: false as const, error: "Only pending transfers can be cancelled" };
  }

  const updated = await prisma.roomTransfer.update({
    where: { id: transferId },
    data: { status: "CANCELLED" },
  });

  return { success: true as const, transfer: updated };
}

export async function getTransferHistory(boardingHouseId: string) {
  // Get transfers via rooms belonging to this house
  const rooms = await prisma.room.findMany({
    where: { boardingHouseId },
    select: { id: true },
  });
  const roomIds = rooms.map((r) => r.id);

  return prisma.roomTransfer.findMany({
    where: { fromRoomId: { in: roomIds } },
    include: {
      tenant: { select: { id: true, name: true } },
      fromRoom: { select: { id: true, number: true, floor: true } },
      toRoom: { select: { id: true, number: true, floor: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
