import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { getTenants, createTenant, updateTenant, assignTenantToRoom } from "./tenant";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;
let roomId: string;
let availableRoomId: string;

async function seed() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId: owner.id });
  houseId = house.boardingHouse!.id;
  const r1 = await createRoom({ number: "101", floor: 1, capacity: 2, monthlyRate: 3000, boardingHouseId: houseId });
  const r2 = await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 2500, boardingHouseId: houseId });
  roomId = r1.room!.id;
  availableRoomId = r2.room!.id;
}

describe("Tenant Management", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("createTenant", () => {
    it("creates a tenant with valid input", async () => {
      const result = await createTenant({
        name: "Maria Santos",
        phone: "0917-123-4567",
        email: "maria@email.com",
        boardingHouseId: houseId,
        roomId,
      });

      expect(result.success).toBe(true);
      expect(result.tenant!.name).toBe("Maria Santos");
      expect(result.tenant!.status).toBe("ACTIVE");
      expect(result.tenant!.roomId).toBe(roomId);
    });

    it("marks room as OCCUPIED when tenant is assigned", async () => {
      await createTenant({ name: "Maria", phone: "0917-000-0000", boardingHouseId: houseId, roomId });

      const room = await prisma.room.findUnique({ where: { id: roomId } });
      expect(room!.status).toBe("OCCUPIED");
    });

    it("rejects empty name", async () => {
      const result = await createTenant({ name: "", phone: "0917-000-0000", boardingHouseId: houseId, roomId });
      expect(result.success).toBe(false);
    });

    it("rejects empty phone", async () => {
      const result = await createTenant({ name: "Maria", phone: "", boardingHouseId: houseId, roomId });
      expect(result.success).toBe(false);
    });

    it("allows creation without room assignment", async () => {
      const result = await createTenant({ name: "Maria", phone: "0917-000-0000", boardingHouseId: houseId });
      expect(result.success).toBe(true);
      expect(result.tenant!.roomId).toBeNull();
    });
  });

  describe("getTenants", () => {
    it("returns tenants for a boarding house", async () => {
      await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId });
      await createTenant({ name: "John", phone: "0917-222", boardingHouseId: houseId, roomId: availableRoomId });

      const tenants = await getTenants(houseId);
      expect(tenants).toHaveLength(2);
    });

    it("filters by status", async () => {
      await createTenant({ name: "Active", phone: "0917-111", boardingHouseId: houseId });
      const inactive = await createTenant({ name: "Left", phone: "0917-222", boardingHouseId: houseId });
      await prisma.tenant.update({ where: { id: inactive.tenant!.id }, data: { status: "INACTIVE" } });

      const active = await getTenants(houseId, { status: "ACTIVE" });
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe("Active");
    });

    it("includes room info", async () => {
      await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId });
      const tenants = await getTenants(houseId);
      expect(tenants[0].room).toBeDefined();
      expect(tenants[0].room!.number).toBe("101");
    });
  });

  describe("updateTenant", () => {
    it("updates tenant details", async () => {
      const created = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId });

      const result = await updateTenant({
        id: created.tenant!.id,
        name: "Maria Santos",
        email: "maria@new.com",
      });

      expect(result.success).toBe(true);
      expect(result.tenant!.name).toBe("Maria Santos");
      expect(result.tenant!.email).toBe("maria@new.com");
    });

    it("can set tenant as INACTIVE", async () => {
      const created = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId });

      const result = await updateTenant({ id: created.tenant!.id, status: "INACTIVE" });
      expect(result.success).toBe(true);
      expect(result.tenant!.status).toBe("INACTIVE");

      // Room should be freed
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      expect(room!.status).toBe("AVAILABLE");
    });
  });

  describe("assignTenantToRoom", () => {
    it("assigns tenant to available room", async () => {
      const tenant = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId });

      const result = await assignTenantToRoom(tenant.tenant!.id, availableRoomId);
      expect(result.success).toBe(true);

      const room = await prisma.room.findUnique({ where: { id: availableRoomId } });
      expect(room!.status).toBe("OCCUPIED");
    });

    it("rejects assignment to maintenance room", async () => {
      await prisma.room.update({ where: { id: availableRoomId }, data: { status: "MAINTENANCE" } });
      const tenant = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId });

      const result = await assignTenantToRoom(tenant.tenant!.id, availableRoomId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not available");
    });
  });
});
