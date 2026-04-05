import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { exportInvoicesCSV, exportTenantsCSV } from "./export";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice } from "./invoice";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({ data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" } });
  const house = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId: owner.id });
  houseId = house.boardingHouse!.id;
  const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
  const tenant = await createTenant({ name: "Maria Santos", phone: "0917-111-0000", email: "maria@test.com", boardingHouseId: houseId, roomId: room.room!.id });
  await createInvoice({ tenantId: tenant.tenant!.id, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate: new Date("2026-05-05") });
}

describe("Data Export", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  describe("exportInvoicesCSV", () => {
    it("returns CSV with headers", async () => {
      const csv = await exportInvoicesCSV(houseId);
      const lines = csv.split("\n");
      expect(lines[0]).toContain("Invoice #");
      expect(lines[0]).toContain("Tenant");
      expect(lines[0]).toContain("Amount");
      expect(lines[0]).toContain("Status");
    });

    it("includes invoice data rows", async () => {
      const csv = await exportInvoicesCSV(houseId);
      expect(csv).toContain("Maria Santos");
      expect(csv).toContain("3000");
      expect(csv).toContain("RENT");
    });

    it("returns headers only for empty house", async () => {
      const hash = await hashPassword("Test123456");
      const owner2 = await prisma.user.create({ data: { name: "O2", email: "o2@test.com", password: hash, role: "OWNER" } });
      const emptyHouse = await createBoardingHouse({ name: "Empty", address: "A", type: "MIXED", ownerId: owner2.id });
      const csv = await exportInvoicesCSV(emptyHouse.boardingHouse!.id);
      const lines = csv.split("\n").filter(l => l.trim());
      expect(lines).toHaveLength(1); // Just header
    });
  });

  describe("exportTenantsCSV", () => {
    it("returns CSV with tenant data", async () => {
      const csv = await exportTenantsCSV(houseId);
      expect(csv).toContain("Name");
      expect(csv).toContain("Maria Santos");
      expect(csv).toContain("0917-111-0000");
      expect(csv).toContain("Room 101");
    });

    it("escapes fields containing commas and formula injection characters", async () => {
      await createTenant({ name: "Smith, John", phone: "0917-222-0000", email: "smith@test.com", boardingHouseId: houseId });
      await createTenant({ name: "=CMD|'/c calc'!A0", phone: "0917-333-0000", email: "evil@test.com", boardingHouseId: houseId });

      const csv = await exportTenantsCSV(houseId);

      // Comma in name must be quoted
      expect(csv).toContain('"Smith, John"');
      // Formula injection must be quoted
      expect(csv).toContain('"=CMD|\'/c calc\'!A0"');
    });
  });
});
