import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  getInvoices,
  createInvoice,
  markInvoicePaid,
  calculateElectricityBill,
  generateMonthlyInvoices,
} from "./invoice";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;
let tenantId: string;
let roomId: string;

async function seed() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId: owner.id });
  houseId = house.boardingHouse!.id;
  const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3500, boardingHouseId: houseId });
  roomId = room.room!.id;
  const tenant = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId });
  tenantId = tenant.tenant!.id;
}

describe("Invoice & Billing", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("createInvoice", () => {
    it("creates a rent invoice", async () => {
      const result = await createInvoice({
        tenantId,
        boardingHouseId: houseId,
        amount: 3500,
        type: "RENT",
        dueDate: new Date("2026-05-05"),
      });

      expect(result.success).toBe(true);
      expect(result.invoice!.amount).toBe(3500);
      expect(result.invoice!.type).toBe("RENT");
      expect(result.invoice!.status).toBe("PENDING");
      expect(result.invoice!.invoiceNumber).toMatch(/^PH-/);
    });

    it("creates an electricity invoice", async () => {
      const result = await createInvoice({
        tenantId,
        boardingHouseId: houseId,
        amount: 1250,
        type: "ELECTRICITY",
        dueDate: new Date("2026-05-10"),
        description: "March 2026 electricity",
      });

      expect(result.success).toBe(true);
      expect(result.invoice!.type).toBe("ELECTRICITY");
    });

    it("rejects zero amount", async () => {
      const result = await createInvoice({
        tenantId,
        boardingHouseId: houseId,
        amount: 0,
        type: "RENT",
        dueDate: new Date("2026-05-05"),
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid type", async () => {
      const result = await createInvoice({
        tenantId,
        boardingHouseId: houseId,
        amount: 1000,
        type: "INVALID" as any,
        dueDate: new Date("2026-05-05"),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getInvoices", () => {
    it("returns invoices for a boarding house", async () => {
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3500, type: "RENT", dueDate: new Date("2026-05-05") });
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 1250, type: "ELECTRICITY", dueDate: new Date("2026-05-10") });

      const invoices = await getInvoices(houseId);
      expect(invoices).toHaveLength(2);
    });

    it("filters by status", async () => {
      const inv = await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3500, type: "RENT", dueDate: new Date("2026-05-05") });
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 1250, type: "ELECTRICITY", dueDate: new Date("2026-05-10") });
      await markInvoicePaid(inv.invoice!.id);

      const pending = await getInvoices(houseId, { status: "PENDING" });
      expect(pending).toHaveLength(1);
      expect(pending[0].type).toBe("ELECTRICITY");
    });

    it("includes tenant info", async () => {
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3500, type: "RENT", dueDate: new Date("2026-05-05") });

      const invoices = await getInvoices(houseId);
      expect(invoices[0].tenant.name).toBe("Maria");
    });
  });

  describe("markInvoicePaid", () => {
    it("marks invoice as paid with current date", async () => {
      const inv = await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3500, type: "RENT", dueDate: new Date("2026-05-05") });

      const result = await markInvoicePaid(inv.invoice!.id);
      expect(result.success).toBe(true);
      expect(result.invoice!.status).toBe("PAID");
      expect(result.invoice!.paidDate).not.toBeNull();
    });

    it("rejects marking already-paid invoice", async () => {
      const inv = await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3500, type: "RENT", dueDate: new Date("2026-05-05") });
      await markInvoicePaid(inv.invoice!.id);

      const result = await markInvoicePaid(inv.invoice!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("already paid");
    });
  });

  describe("calculateElectricityBill", () => {
    it("calculates based on meter readings", () => {
      const amount = calculateElectricityBill({
        currentReading: 1250,
        previousReading: 1150,
        ratePerUnit: 12.5,
      });

      expect(amount).toBe(1250); // (1250 - 1150) * 12.5
    });

    it("returns 0 for same readings", () => {
      const amount = calculateElectricityBill({
        currentReading: 1000,
        previousReading: 1000,
        ratePerUnit: 12.5,
      });

      expect(amount).toBe(0);
    });
  });

  describe("generateMonthlyInvoices", () => {
    it("creates rent invoices for all active tenants with rooms", async () => {
      const room2 = await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 2800, boardingHouseId: houseId });
      await createTenant({ name: "John", phone: "0917-222", boardingHouseId: houseId, roomId: room2.room!.id });

      const result = await generateMonthlyInvoices(houseId, "2026-05");
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      const invoices = await getInvoices(houseId);
      expect(invoices).toHaveLength(2);
      const amounts = invoices.map((i) => i.amount).sort();
      expect(amounts).toEqual([2800, 3500]);
    });

    it("uses tenant move-in day for due date", async () => {
      // Tenant moved in on 15th → due date should be 15th
      await prisma.tenant.update({ where: { id: tenantId }, data: { moveInDate: new Date("2025-06-15") } });

      const result = await generateMonthlyInvoices(houseId, "2026-05");
      expect(result.success).toBe(true);

      const invoices = await getInvoices(houseId);
      expect(invoices[0].dueDate.getDate()).toBe(15);
    });

    it("clamps due date to month-end for short months", async () => {
      // Tenant moved in on 31st → Feb due date should be 28th
      await prisma.tenant.update({ where: { id: tenantId }, data: { moveInDate: new Date("2025-01-31") } });

      const result = await generateMonthlyInvoices(houseId, "2026-02");
      expect(result.success).toBe(true);

      const invoices = await getInvoices(houseId);
      expect(invoices[0].dueDate.getDate()).toBe(28);
    });

    it("different tenants get different due dates based on move-in", async () => {
      const room2 = await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 2800, boardingHouseId: houseId });
      const t2 = await createTenant({ name: "John", phone: "0917-222", boardingHouseId: houseId, roomId: room2.room!.id });

      // Set different move-in dates
      await prisma.tenant.update({ where: { id: tenantId }, data: { moveInDate: new Date("2025-06-10") } });
      await prisma.tenant.update({ where: { id: t2.tenant!.id }, data: { moveInDate: new Date("2025-08-25") } });

      await generateMonthlyInvoices(houseId, "2026-05");
      const invoices = await getInvoices(houseId);

      const dueDates = invoices.map((i) => i.dueDate.getDate()).sort();
      expect(dueDates).toEqual([10, 25]);
    });
  });
});
