import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { flagBoardingHouse, unflagBoardingHouse, unpublishBoardingHouse, getModerationQueue } from "./moderation";
import { createBoardingHouse } from "./boarding-house";
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
  await prisma.boardingHouse.update({ where: { id: houseId }, data: { published: true, verified: true } });
}

describe("Content Moderation", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  describe("flagBoardingHouse", () => {
    it("flags a house with reason", async () => {
      const result = await flagBoardingHouse(houseId, "Suspicious pricing claims");
      expect(result.success).toBe(true);

      const house = await prisma.boardingHouse.findUnique({ where: { id: houseId } });
      expect(house!.flagged).toBe(true);
      expect(house!.flagReason).toBe("Suspicious pricing claims");
    });

    it("rejects flagging non-existent house", async () => {
      const result = await flagBoardingHouse("fake-id", "Reason");
      expect(result.success).toBe(false);
    });
  });

  describe("unflagBoardingHouse", () => {
    it("clears the flag", async () => {
      await flagBoardingHouse(houseId, "Test flag");
      const result = await unflagBoardingHouse(houseId);
      expect(result.success).toBe(true);

      const house = await prisma.boardingHouse.findUnique({ where: { id: houseId } });
      expect(house!.flagged).toBe(false);
      expect(house!.flagReason).toBeNull();
    });
  });

  describe("unpublishBoardingHouse", () => {
    it("unpublishes a house", async () => {
      const result = await unpublishBoardingHouse(houseId);
      expect(result.success).toBe(true);

      const house = await prisma.boardingHouse.findUnique({ where: { id: houseId } });
      expect(house!.published).toBe(false);
    });
  });

  describe("getModerationQueue", () => {
    it("returns flagged houses", async () => {
      await flagBoardingHouse(houseId, "Bad listing");
      const queue = await getModerationQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].name).toBe("Test House");
      expect(queue[0].flagReason).toBe("Bad listing");
    });

    it("returns empty when nothing flagged", async () => {
      const queue = await getModerationQueue();
      expect(queue).toHaveLength(0);
    });

    it("includes owner info", async () => {
      await flagBoardingHouse(houseId, "Review needed");
      const queue = await getModerationQueue();
      expect(queue[0].owner.name).toBe("Owner");
    });
  });
});
