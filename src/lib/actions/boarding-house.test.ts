import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  getOwnerBoardingHouses,
  createBoardingHouse,
  updateBoardingHouse,
  getBoardingHouseById,
} from "./boarding-house";
import { searchBoardingHouses } from "./finder";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let ownerId: string;
let otherOwnerId: string;

async function seedOwners() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Test Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  const other = await prisma.user.create({
    data: { name: "Other Owner", email: "other@test.com", password: hash, role: "OWNER" },
  });
  ownerId = owner.id;
  otherOwnerId = other.id;
}

describe("Boarding House CRUD", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seedOwners();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("createBoardingHouse", () => {
    it("creates a boarding house with valid input", async () => {
      const result = await createBoardingHouse({
        name: "Casa Marina",
        address: "Brgy. Sainz, Mati City",
        type: "ALL_FEMALE",
        description: "A cozy boarding house",
        ownerId,
      });

      expect(result.success).toBe(true);
      expect(result.boardingHouse).toBeDefined();
      expect(result.boardingHouse!.name).toBe("Casa Marina");
      expect(result.boardingHouse!.type).toBe("ALL_FEMALE");
      expect(result.boardingHouse!.city).toBe("Mati City");
    });

    it("rejects empty name", async () => {
      const result = await createBoardingHouse({
        name: "",
        address: "Some address",
        type: "MIXED",
        ownerId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects invalid type", async () => {
      const result = await createBoardingHouse({
        name: "Test House",
        address: "Some address",
        type: "INVALID" as any,
        ownerId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("defaults to unpublished and unverified", async () => {
      const result = await createBoardingHouse({
        name: "New Place",
        address: "Test Address",
        type: "MIXED",
        ownerId,
      });

      expect(result.boardingHouse!.published).toBe(false);
      expect(result.boardingHouse!.verified).toBe(false);
    });
  });

  describe("getOwnerBoardingHouses", () => {
    it("returns only houses belonging to the owner", async () => {
      await createBoardingHouse({ name: "My House", address: "Addr 1", type: "MIXED", ownerId });
      await createBoardingHouse({ name: "Other House", address: "Addr 2", type: "MIXED", ownerId: otherOwnerId });

      const houses = await getOwnerBoardingHouses(ownerId);
      expect(houses).toHaveLength(1);
      expect(houses[0].name).toBe("My House");
    });

    it("returns empty array for owner with no houses", async () => {
      const houses = await getOwnerBoardingHouses(ownerId);
      expect(houses).toEqual([]);
    });

    it("includes room counts", async () => {
      const result = await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId });
      await prisma.room.create({
        data: { number: "101", monthlyRate: 3000, status: "OCCUPIED", boardingHouseId: result.boardingHouse!.id },
      });
      await prisma.room.create({
        data: { number: "102", monthlyRate: 2500, status: "AVAILABLE", boardingHouseId: result.boardingHouse!.id },
      });

      const houses = await getOwnerBoardingHouses(ownerId);
      expect(houses[0].totalRooms).toBe(2);
      expect(houses[0].occupiedRooms).toBe(1);
    });
  });

  describe("getBoardingHouseById", () => {
    it("returns the boarding house with details", async () => {
      const created = await createBoardingHouse({
        name: "Casa Test",
        address: "Test Addr",
        type: "ALL_MALE",
        description: "Test description",
        ownerId,
      });

      const house = await getBoardingHouseById(created.boardingHouse!.id);
      expect(house).not.toBeNull();
      expect(house!.name).toBe("Casa Test");
      expect(house!.type).toBe("ALL_MALE");
    });

    it("returns null for non-existent id", async () => {
      const house = await getBoardingHouseById("non-existent-id");
      expect(house).toBeNull();
    });
  });

  describe("updateBoardingHouse", () => {
    it("updates allowed fields", async () => {
      const created = await createBoardingHouse({ name: "Old Name", address: "Addr", type: "MIXED", ownerId });

      const result = await updateBoardingHouse({
        id: created.boardingHouse!.id,
        ownerId,
        name: "New Name",
        type: "ALL_FEMALE",
        hasCurfew: true,
        curfewTime: "22:00",
      });

      expect(result.success).toBe(true);
      expect(result.boardingHouse!.name).toBe("New Name");
      expect(result.boardingHouse!.type).toBe("ALL_FEMALE");
      expect(result.boardingHouse!.hasCurfew).toBe(true);
    });

    it("rejects update by non-owner", async () => {
      const created = await createBoardingHouse({ name: "My House", address: "Addr", type: "MIXED", ownerId });

      const result = await updateBoardingHouse({
        id: created.boardingHouse!.id,
        ownerId: otherOwnerId,
        name: "Hijacked",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("permission");
    });
  });

  describe("searchBoardingHouses", () => {
    it("returns only published and verified houses", async () => {
      const created = await createBoardingHouse({ name: "Public House", address: "Addr", type: "MIXED", ownerId });
      await prisma.boardingHouse.update({
        where: { id: created.boardingHouse!.id },
        data: { published: true, verified: true },
      });
      await createBoardingHouse({ name: "Draft House", address: "Addr 2", type: "MIXED", ownerId });

      const houses = await searchBoardingHouses({});
      expect(houses).toHaveLength(1);
      expect(houses[0].name).toBe("Public House");
    });

    it("filters by type", async () => {
      const h1 = await createBoardingHouse({ name: "Female House", address: "A", type: "ALL_FEMALE", ownerId });
      const h2 = await createBoardingHouse({ name: "Male House", address: "B", type: "ALL_MALE", ownerId });
      await prisma.boardingHouse.updateMany({ data: { published: true, verified: true } });

      const houses = await searchBoardingHouses({ type: "ALL_FEMALE" });
      expect(houses).toHaveLength(1);
      expect(houses[0].name).toBe("Female House");
    });
  });
});
