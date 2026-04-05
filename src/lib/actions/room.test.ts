import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { getRooms, createRoom, updateRoom, updateRoomStatus } from "./room";
import { createBoardingHouse } from "./boarding-house";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let ownerId: string;
let houseId: string;

async function seedHouse() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  ownerId = owner.id;
  const result = await createBoardingHouse({
    name: "Test House", address: "Addr", type: "MIXED", ownerId,
  });
  houseId = result.boardingHouse!.id;
}

describe("Room Management", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seedHouse();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("createRoom", () => {
    it("creates a room with valid input", async () => {
      const result = await createRoom({
        number: "101",
        floor: 1,
        capacity: 2,
        monthlyRate: 3500,
        hasAircon: true,
        hasWifi: true,
        hasBathroom: true,
        electricityIncluded: false,
        boardingHouseId: houseId,
      });

      expect(result.success).toBe(true);
      expect(result.room!.number).toBe("101");
      expect(result.room!.status).toBe("AVAILABLE");
      expect(result.room!.monthlyRate).toBe(3500);
    });

    it("rejects duplicate room number in same house", async () => {
      await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });
      const result = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("rejects zero or negative monthly rate", async () => {
      const result = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 0, boardingHouseId: houseId });
      expect(result.success).toBe(false);
    });
  });

  describe("getRooms", () => {
    it("returns rooms for a boarding house", async () => {
      await createRoom({ number: "101", floor: 1, capacity: 2, monthlyRate: 3500, boardingHouseId: houseId });
      await createRoom({ number: "201", floor: 2, capacity: 1, monthlyRate: 2800, boardingHouseId: houseId });

      const rooms = await getRooms(houseId);
      expect(rooms).toHaveLength(2);
    });

    it("includes tenant info for occupied rooms", async () => {
      const room = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
      await prisma.room.update({ where: { id: room.room!.id }, data: { status: "OCCUPIED" } });
      await prisma.tenant.create({
        data: {
          name: "Maria Santos", phone: "0917-000-0000", moveInDate: new Date(),
          status: "ACTIVE", roomId: room.room!.id, boardingHouseId: houseId,
        },
      });

      const rooms = await getRooms(houseId);
      expect(rooms[0].tenants).toHaveLength(1);
      expect(rooms[0].tenants[0].name).toBe("Maria Santos");
    });

    it("orders rooms by number", async () => {
      await createRoom({ number: "201", floor: 2, capacity: 1, monthlyRate: 2800, boardingHouseId: houseId });
      await createRoom({ number: "101", floor: 1, capacity: 2, monthlyRate: 3500, boardingHouseId: houseId });

      const rooms = await getRooms(houseId);
      expect(rooms[0].number).toBe("101");
      expect(rooms[1].number).toBe("201");
    });
  });

  describe("updateRoom", () => {
    it("updates room details", async () => {
      const created = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });

      const result = await updateRoom({
        id: created.room!.id,
        monthlyRate: 3000,
        hasAircon: true,
        capacity: 2,
      });

      expect(result.success).toBe(true);
      expect(result.room!.monthlyRate).toBe(3000);
      expect(result.room!.hasAircon).toBe(true);
      expect(result.room!.capacity).toBe(2);
    });
  });

  describe("roomType", () => {
    it("defaults to BEDSPACER when not specified", async () => {
      const result = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });
      expect(result.room!.roomType).toBe("BEDSPACER");
    });

    it("creates room with specified type", async () => {
      const result = await createRoom({ number: "101", floor: 1, capacity: 2, monthlyRate: 4500, boardingHouseId: houseId, roomType: "APARTMENT" });
      expect(result.room!.roomType).toBe("APARTMENT");
    });

    it("updates room type", async () => {
      const created = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });
      const result = await updateRoom({ id: created.room!.id, roomType: "STUDIO" });
      expect(result.success).toBe(true);
      expect(result.room!.roomType).toBe("STUDIO");
    });
  });

  describe("updateRoomStatus", () => {
    it("changes room status to MAINTENANCE", async () => {
      const created = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });

      const result = await updateRoomStatus(created.room!.id, "MAINTENANCE");
      expect(result.success).toBe(true);
      expect(result.room!.status).toBe("MAINTENANCE");
    });

    it("changes MAINTENANCE back to AVAILABLE", async () => {
      const created = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });
      await updateRoomStatus(created.room!.id, "MAINTENANCE");

      const result = await updateRoomStatus(created.room!.id, "AVAILABLE");
      expect(result.success).toBe(true);
      expect(result.room!.status).toBe("AVAILABLE");
    });

    it("rejects invalid status", async () => {
      const created = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: houseId });

      const result = await updateRoomStatus(created.room!.id, "INVALID" as any);
      expect(result.success).toBe(false);
    });
  });
});
