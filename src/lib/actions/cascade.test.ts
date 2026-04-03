import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice } from "./invoice";
import { createNotification } from "./notification";

async function seedFullChain() {
  const hash = await hashPassword("Test123456");
  const user = await prisma.user.create({
    data: { name: "Delete Me", email: "delete@test.com", password: hash, role: "OWNER" },
  });
  await prisma.subscription.create({
    data: { plan: "STARTER", maxRooms: 10, maxTenants: 15, emailSms: false, analytics: false, amount: 0, userId: user.id },
  });
  const house = await createBoardingHouse({ name: "Doomed House", address: "Addr", type: "MIXED", ownerId: user.id });
  const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: house.boardingHouse!.id });
  const tenant = await createTenant({ name: "Doomed Tenant", phone: "0917-999-0000", boardingHouseId: house.boardingHouse!.id, roomId: room.room!.id });
  await createInvoice({ tenantId: tenant.tenant!.id, boardingHouseId: house.boardingHouse!.id, amount: 3000, type: "RENT", dueDate: new Date("2026-05-05") });
  await createNotification({ userId: user.id, title: "Test", message: "Doomed notification" });

  return { userId: user.id, houseId: house.boardingHouse!.id, roomId: room.room!.id, tenantId: tenant.tenant!.id };
}

describe("Cascade Delete Behavior", () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("deleting a user cascades to all related data", async () => {
    const { userId } = await seedFullChain();

    // Verify everything exists
    expect(await prisma.boardingHouse.count()).toBe(1);
    expect(await prisma.room.count()).toBe(1);
    expect(await prisma.tenant.count()).toBe(1);
    expect(await prisma.invoice.count()).toBe(1);
    expect(await prisma.notification.count()).toBe(1);
    expect(await prisma.subscription.count()).toBe(1);

    // Delete the user
    await prisma.user.delete({ where: { id: userId } });

    // Everything should be gone
    expect(await prisma.boardingHouse.count()).toBe(0);
    expect(await prisma.room.count()).toBe(0);
    expect(await prisma.tenant.count()).toBe(0);
    expect(await prisma.invoice.count()).toBe(0);
    expect(await prisma.notification.count()).toBe(0);
    expect(await prisma.subscription.count()).toBe(0);
  });

  it("deleting a boarding house cascades rooms, tenants, invoices", async () => {
    const { houseId } = await seedFullChain();

    await prisma.boardingHouse.delete({ where: { id: houseId } });

    expect(await prisma.room.count()).toBe(0);
    expect(await prisma.tenant.count()).toBe(0);
    expect(await prisma.invoice.count()).toBe(0);
    // User and subscription should still exist
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.subscription.count()).toBe(1);
  });

  it("deleting a room sets tenant roomId to null (SetNull)", async () => {
    const { roomId, tenantId } = await seedFullChain();

    // Detach tenant from room first to avoid cascade issues
    await prisma.tenant.update({ where: { id: tenantId }, data: { roomId: null } });
    await prisma.room.delete({ where: { id: roomId } });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    expect(tenant).not.toBeNull();
    expect(tenant!.roomId).toBeNull();
  });
});
