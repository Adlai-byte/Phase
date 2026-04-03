import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createTransfer, approveTransfer, getTransferHistory } from "./transfer";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;
let tenantId: string;
let fromRoomId: string;
let toRoomId: string;

async function seed() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId: owner.id });
  houseId = house.boardingHouse!.id;
  const r1 = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
  const r2 = await createRoom({ number: "201", floor: 2, capacity: 1, monthlyRate: 3500, boardingHouseId: houseId });
  fromRoomId = r1.room!.id;
  toRoomId = r2.room!.id;
  const t = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId: fromRoomId });
  tenantId = t.tenant!.id;
}

describe("Room Transfers", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("createTransfer", () => {
    it("creates a pending transfer request", async () => {
      const result = await createTransfer({
        tenantId,
        fromRoomId,
        toRoomId,
        reason: "Wants AC room",
      });

      expect(result.success).toBe(true);
      expect(result.transfer!.status).toBe("PENDING");
      expect(result.transfer!.tenantId).toBe(tenantId);
    });

    it("rejects transfer to non-available room", async () => {
      await prisma.room.update({ where: { id: toRoomId }, data: { status: "MAINTENANCE" } });

      const result = await createTransfer({ tenantId, fromRoomId, toRoomId, reason: "Test" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
    });

    it("rejects transfer to same room", async () => {
      const result = await createTransfer({ tenantId, fromRoomId, toRoomId: fromRoomId, reason: "Test" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("same room");
    });
  });

  describe("approveTransfer", () => {
    it("moves tenant, updates both rooms", async () => {
      const req = await createTransfer({ tenantId, fromRoomId, toRoomId, reason: "Upgrade" });

      const result = await approveTransfer(req.transfer!.id);
      expect(result.success).toBe(true);
      expect(result.transfer!.status).toBe("COMPLETED");

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant!.roomId).toBe(toRoomId);

      const oldRoom = await prisma.room.findUnique({ where: { id: fromRoomId } });
      expect(oldRoom!.status).toBe("AVAILABLE");

      const newRoom = await prisma.room.findUnique({ where: { id: toRoomId } });
      expect(newRoom!.status).toBe("OCCUPIED");
    });

    it("rejects approving already completed transfer", async () => {
      const req = await createTransfer({ tenantId, fromRoomId, toRoomId, reason: "Test" });
      await approveTransfer(req.transfer!.id);

      const result = await approveTransfer(req.transfer!.id);
      expect(result.success).toBe(false);
    });
  });

  describe("getTransferHistory", () => {
    it("returns transfers for a boarding house", async () => {
      await createTransfer({ tenantId, fromRoomId, toRoomId, reason: "Test 1" });

      const history = await getTransferHistory(houseId);
      expect(history).toHaveLength(1);
      expect(history[0].tenant.name).toBe("Maria");
      expect(history[0].fromRoom.number).toBe("101");
      expect(history[0].toRoom.number).toBe("201");
    });
  });
});
