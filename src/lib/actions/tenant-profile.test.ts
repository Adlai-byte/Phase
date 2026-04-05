import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { getTenantProfile } from "./tenant-profile";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice, markInvoicePaid } from "./invoice";
import { createTransfer, approveTransfer } from "./transfer";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;
let tenantId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId: owner.id });
  houseId = house.boardingHouse!.id;
  const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
  const t = await createTenant({ name: "Maria Santos", phone: "0917-111-0000", email: "maria@test.com", boardingHouseId: houseId, roomId: room.room!.id });
  tenantId = t.tenant!.id;

  // Add invoices
  const inv1 = await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate: new Date("2026-03-05") });
  await markInvoicePaid(inv1.invoice!.id);
  await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate: new Date("2026-04-05") });

  // Add transfer
  const room2 = await createRoom({ number: "201", floor: 2, capacity: 1, monthlyRate: 3500, boardingHouseId: houseId });
  const transfer = await createTransfer({ tenantId, fromRoomId: room.room!.id, toRoomId: room2.room!.id, reason: "Upgrade" });
  await approveTransfer(transfer.transfer!.id);
}

describe("Tenant Profile", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  it("returns tenant with personal info", async () => {
    const profile = await getTenantProfile(tenantId);
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe("Maria Santos");
    expect(profile!.email).toBe("maria@test.com");
    expect(profile!.phone).toBe("0917-111-0000");
  });

  it("includes payment history", async () => {
    const profile = await getTenantProfile(tenantId);
    expect(profile!.invoices).toHaveLength(2);
    const paid = profile!.invoices.filter((i: any) => i.status === "PAID");
    expect(paid).toHaveLength(1);
  });

  it("includes room transfer history", async () => {
    const profile = await getTenantProfile(tenantId);
    expect(profile!.transfers).toHaveLength(1);
    expect(profile!.transfers[0].fromRoom.number).toBe("101");
    expect(profile!.transfers[0].toRoom.number).toBe("201");
    expect(profile!.transfers[0].status).toBe("COMPLETED");
  });

  it("includes current room info", async () => {
    const profile = await getTenantProfile(tenantId);
    expect(profile!.room).not.toBeNull();
  });

  it("returns null for non-existent tenant", async () => {
    const profile = await getTenantProfile("fake-id");
    expect(profile).toBeNull();
  });
});
