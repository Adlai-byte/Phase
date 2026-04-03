import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createBoardingHouse } from "./boarding-house";
import { createRoom, updateRoomStatus } from "./room";
import { createTenant, assignTenantToRoom, updateTenant } from "./tenant";
import { createInvoice, markInvoicePaid, generateMonthlyInvoices } from "./invoice";
import { createTransfer, approveTransfer } from "./transfer";
import { getOwnerDashboardStats, getOccupancyStats } from "./analytics";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let ownerId: string;
let houseId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  ownerId = owner.id;
  const house = await createBoardingHouse({ name: "Test House", address: "Addr", type: "MIXED", ownerId });
  houseId = house.boardingHouse!.id;
}

describe("Edge Cases", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("Room assignment conflicts", () => {
    it("rejects assigning tenant to maintenance room", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await updateRoomStatus(room.room!.id, "MAINTENANCE");
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId });

      const result = await assignTenantToRoom(tenant.tenant!.id, room.room!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
    });

    it("rejects assigning tenant to already occupied room", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await createTenant({ name: "Tenant A", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room.room!.id });
      // Room is now OCCUPIED
      const tenant2 = await createTenant({ name: "Tenant B", phone: "0917-222-0000", boardingHouseId: houseId });

      const result = await assignTenantToRoom(tenant2.tenant!.id, room.room!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
    });
  });

  describe("Transfer edge cases", () => {
    it("rejects transfer to same room", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room.room!.id });

      const result = await createTransfer({
        tenantId: tenant.tenant!.id,
        fromRoomId: room.room!.id,
        toRoomId: room.room!.id,
        reason: "Test",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("same room");
    });

    it("rejects transfer to maintenance room", async () => {
      const room1 = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const room2 = await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await updateRoomStatus(room2.room!.id, "MAINTENANCE");
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room1.room!.id });

      const result = await createTransfer({
        tenantId: tenant.tenant!.id,
        fromRoomId: room1.room!.id,
        toRoomId: room2.room!.id,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
    });

    it("rejects approving already completed transfer", async () => {
      const room1 = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const room2 = await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room1.room!.id });
      const transfer = await createTransfer({
        tenantId: tenant.tenant!.id,
        fromRoomId: room1.room!.id,
        toRoomId: room2.room!.id,
      });

      await approveTransfer(transfer.transfer!.id);
      const result = await approveTransfer(transfer.transfer!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not in pending");
    });

    it("correctly updates both rooms on approved transfer", async () => {
      const room1 = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const room2 = await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 3500, boardingHouseId: houseId });
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room1.room!.id });

      await approveTransfer(
        (await createTransfer({
          tenantId: tenant.tenant!.id,
          fromRoomId: room1.room!.id,
          toRoomId: room2.room!.id,
        })).transfer!.id
      );

      const oldRoom = await prisma.room.findUnique({ where: { id: room1.room!.id } });
      const newRoom = await prisma.room.findUnique({ where: { id: room2.room!.id } });
      const updatedTenant = await prisma.tenant.findUnique({ where: { id: tenant.tenant!.id } });

      expect(oldRoom!.status).toBe("AVAILABLE");
      expect(newRoom!.status).toBe("OCCUPIED");
      expect(updatedTenant!.roomId).toBe(room2.room!.id);
    });
  });

  describe("Invoice edge cases", () => {
    it("rejects marking already-paid invoice as paid", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room.room!.id });
      const inv = await createInvoice({
        tenantId: tenant.tenant!.id, boardingHouseId: houseId,
        amount: 3000, type: "RENT", dueDate: new Date("2026-05-05"),
      });

      await markInvoicePaid(inv.invoice!.id);
      const result = await markInvoicePaid(inv.invoice!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("already paid");
    });

    it("generates invoices only for tenants with rooms", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await createTenant({ name: "With Room", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room.room!.id });
      await createTenant({ name: "No Room", phone: "0917-222-0000", boardingHouseId: houseId }); // No room

      const result = await generateMonthlyInvoices(houseId, "2026-05");
      expect(result.count).toBe(1); // Only tenant with room
    });
  });

  describe("Tenant lifecycle", () => {
    it("frees room when tenant set to INACTIVE", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const tenant = await createTenant({ name: "Maria", phone: "0917-111-0000", boardingHouseId: houseId, roomId: room.room!.id });

      const beforeRoom = await prisma.room.findUnique({ where: { id: room.room!.id } });
      expect(beforeRoom!.status).toBe("OCCUPIED");

      await updateTenant({ id: tenant.tenant!.id, status: "INACTIVE" });

      const afterRoom = await prisma.room.findUnique({ where: { id: room.room!.id } });
      expect(afterRoom!.status).toBe("AVAILABLE");
    });
  });

  describe("Empty state handling", () => {
    it("returns zero stats for owner with no properties", async () => {
      const stats = await getOwnerDashboardStats(ownerId);
      // Owner has a house but no rooms or tenants
      expect(stats.totalRooms).toBe(0);
      expect(stats.totalTenants).toBe(0);
      expect(stats.occupancyRate).toBe(0);
      expect(stats.totalRevenue).toBe(0);
    });

    it("returns 0% occupancy for house with no rooms", async () => {
      const stats = await getOccupancyStats(houseId);
      expect(stats.totalRooms).toBe(0);
      expect(stats.occupancyRate).toBe(0);
    });

    it("generates 0 invoices for house with no tenants", async () => {
      const result = await generateMonthlyInvoices(houseId, "2026-05");
      expect(result.count).toBe(0);
    });
  });

  describe("Duplicate room numbers", () => {
    it("rejects duplicate room number in same house", async () => {
      await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const result = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2500, boardingHouseId: houseId });
      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("allows same room number in different houses", async () => {
      await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });

      const house2 = await createBoardingHouse({ name: "House 2", address: "Addr 2", type: "MIXED", ownerId });
      const result = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2500, boardingHouseId: house2.boardingHouse!.id });
      expect(result.success).toBe(true);
    });
  });
});
