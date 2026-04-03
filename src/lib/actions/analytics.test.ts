import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { getRevenueByMonth, getOccupancyStats, getOwnerDashboardStats } from "./analytics";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice, markInvoicePaid } from "./invoice";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let ownerId: string;
let houseId: string;

async function seed() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  ownerId = owner.id;
  const house = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId });
  houseId = house.boardingHouse!.id;
}

describe("Analytics", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("getRevenueByMonth", () => {
    it("aggregates paid invoices by month", async () => {
      const r = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const t = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId: r.room!.id });

      // Create invoices in different months
      const inv1 = await createInvoice({ tenantId: t.tenant!.id, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate: new Date("2026-03-05") });
      const inv2 = await createInvoice({ tenantId: t.tenant!.id, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate: new Date("2026-04-05") });
      await markInvoicePaid(inv1.invoice!.id);
      await markInvoicePaid(inv2.invoice!.id);

      const revenue = await getRevenueByMonth(houseId, 6);
      expect(revenue.length).toBeGreaterThan(0);
      const total = revenue.reduce((s, r) => s + r.revenue, 0);
      expect(total).toBe(6000);
    });

    it("returns zeros for months with no revenue", async () => {
      const revenue = await getRevenueByMonth(houseId, 3);
      expect(revenue).toHaveLength(3);
      expect(revenue.every((r) => r.revenue === 0)).toBe(true);
    });
  });

  describe("getOccupancyStats", () => {
    it("calculates occupancy rate correctly", async () => {
      await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      const r3 = await createRoom({ number: "103", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await createTenant({ name: "T1", phone: "0917-111", boardingHouseId: houseId, roomId: r3.room!.id });

      // Manually mark first two as occupied too for testing
      // r3 is already occupied via createTenant

      const stats = await getOccupancyStats(houseId);
      expect(stats.totalRooms).toBe(3);
      expect(stats.occupiedRooms).toBe(1);
      expect(stats.availableRooms).toBe(2);
      expect(stats.occupancyRate).toBe(33); // 1/3 rounded
    });

    it("handles zero rooms", async () => {
      const stats = await getOccupancyStats(houseId);
      expect(stats.totalRooms).toBe(0);
      expect(stats.occupancyRate).toBe(0);
    });
  });

  describe("getOwnerDashboardStats", () => {
    it("returns aggregated stats across all properties", async () => {
      const r1 = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 2500, boardingHouseId: houseId });
      const t = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId: r1.room!.id });
      const inv = await createInvoice({ tenantId: t.tenant!.id, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate: new Date("2026-04-05") });
      await createInvoice({ tenantId: t.tenant!.id, boardingHouseId: houseId, amount: 1000, type: "ELECTRICITY", dueDate: new Date("2026-04-10") });
      await markInvoicePaid(inv.invoice!.id);

      const stats = await getOwnerDashboardStats(ownerId);
      expect(stats.totalTenants).toBe(1);
      expect(stats.totalRooms).toBe(2);
      expect(stats.occupiedRooms).toBe(1);
      expect(stats.totalRevenue).toBe(3000);
      expect(stats.pendingInvoices).toBe(1);
    });
  });
});
