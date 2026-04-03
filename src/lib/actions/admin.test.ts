import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { verifyOwner, rejectOwner, getPlatformOverview, getAllOwners } from "./admin";
import { createBoardingHouse } from "./boarding-house";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

async function seedOwners() {
  const hash = await hashPassword("test123456");
  await prisma.user.create({
    data: { name: "Verified Owner", email: "verified@test.com", password: hash, role: "OWNER", verified: true },
  });
  await prisma.user.create({
    data: { name: "Pending Owner", email: "pending@test.com", password: hash, role: "OWNER", verified: false },
  });
  await prisma.user.create({
    data: { name: "Admin", email: "admin@test.com", password: hash, role: "SUPERADMIN", verified: true },
  });
}

describe("Superadmin Operations", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seedOwners();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("verifyOwner", () => {
    it("sets owner verified to true", async () => {
      const owner = await prisma.user.findUnique({ where: { email: "pending@test.com" } });
      const result = await verifyOwner(owner!.id);

      expect(result.success).toBe(true);
      const updated = await prisma.user.findUnique({ where: { id: owner!.id } });
      expect(updated!.verified).toBe(true);
    });

    it("rejects non-existent user", async () => {
      const result = await verifyOwner("fake-id");
      expect(result.success).toBe(false);
    });

    it("rejects verifying a SUPERADMIN", async () => {
      const admin = await prisma.user.findUnique({ where: { email: "admin@test.com" } });
      const result = await verifyOwner(admin!.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("owner");
    });
  });

  describe("rejectOwner", () => {
    it("deletes the unverified owner", async () => {
      const owner = await prisma.user.findUnique({ where: { email: "pending@test.com" } });
      const result = await rejectOwner(owner!.id);

      expect(result.success).toBe(true);
      const deleted = await prisma.user.findUnique({ where: { id: owner!.id } });
      expect(deleted).toBeNull();
    });

    it("rejects deleting verified owner", async () => {
      const owner = await prisma.user.findUnique({ where: { email: "verified@test.com" } });
      const result = await rejectOwner(owner!.id);
      expect(result.success).toBe(false);
    });
  });

  describe("getAllOwners", () => {
    it("returns only OWNER users, not admins", async () => {
      const owners = await getAllOwners();
      expect(owners).toHaveLength(2);
      expect(owners.every((o) => o.role === "OWNER")).toBe(true);
    });

    it("includes verification status", async () => {
      const owners = await getAllOwners();
      const verified = owners.find((o) => o.email === "verified@test.com");
      const pending = owners.find((o) => o.email === "pending@test.com");
      expect(verified!.verified).toBe(true);
      expect(pending!.verified).toBe(false);
    });
  });

  describe("verifyOwner edge cases", () => {
    it("verifying already-verified owner still succeeds", async () => {
      const owner = await prisma.user.findUnique({ where: { email: "verified@test.com" } });
      const result = await verifyOwner(owner!.id);
      expect(result.success).toBe(true);
      const updated = await prisma.user.findUnique({ where: { id: owner!.id } });
      expect(updated!.verified).toBe(true);
    });
  });

  describe("rejectOwner edge cases", () => {
    it("rejects non-existent user", async () => {
      const result = await rejectOwner("fake-id");
      expect(result.success).toBe(false);
    });

    it("cascades delete through boarding houses when rejecting unverified owner", async () => {
      const hash = await hashPassword("Test123456");
      const owner = await prisma.user.create({
        data: { name: "Unverified", email: "unverified@test.com", password: hash, role: "OWNER", verified: false },
      });
      await createBoardingHouse({ name: "House", address: "Addr", type: "MIXED", ownerId: owner.id });

      const result = await rejectOwner(owner.id);
      expect(result.success).toBe(true);
      expect(await prisma.boardingHouse.count({ where: { ownerId: owner.id } })).toBe(0);
    });
  });

  describe("getPlatformOverview", () => {
    it("returns aggregated platform stats", async () => {
      const stats = await getPlatformOverview();
      expect(stats.totalOwners).toBe(2);
      expect(stats.verifiedOwners).toBe(1);
      expect(stats.pendingVerifications).toBe(1);
    });

    it("includes boarding house and room counts", async () => {
      const stats = await getPlatformOverview();
      expect(stats.totalBoardingHouses).toBeDefined();
      expect(stats.totalRooms).toBeDefined();
      expect(stats.totalTenants).toBeDefined();
      expect(stats.totalRevenue).toBeDefined();
    });
  });

  describe("getAllOwners details", () => {
    it("includes subscription plan info", async () => {
      const hash = await hashPassword("Test123456");
      const subOwner = await prisma.user.create({
        data: { name: "Sub Owner", email: "sub@test.com", password: hash, role: "OWNER" },
      });
      await prisma.subscription.create({
        data: { plan: "PROFESSIONAL", maxRooms: 30, maxTenants: 50, emailSms: true, analytics: true, amount: 999, userId: subOwner.id },
      });

      const owners = await getAllOwners();
      const found = owners.find((o) => o.email === "sub@test.com");
      expect(found!.subscription).not.toBeNull();
      expect(found!.subscription!.plan).toBe("PROFESSIONAL");
    });

    it("includes boarding house count", async () => {
      const owner = await prisma.user.findUnique({ where: { email: "verified@test.com" } });
      await createBoardingHouse({ name: "H1", address: "A", type: "MIXED", ownerId: owner!.id });
      await createBoardingHouse({ name: "H2", address: "B", type: "MIXED", ownerId: owner!.id });

      const owners = await getAllOwners();
      const found = owners.find((o) => o.email === "verified@test.com");
      expect(found!._count.boardingHouses).toBe(2);
    });

    it("orders by createdAt descending", async () => {
      const owners = await getAllOwners();
      expect(owners.length).toBeGreaterThan(1);
      for (let i = 1; i < owners.length; i++) {
        expect(new Date(owners[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(owners[i].createdAt).getTime()
        );
      }
    });
  });
});
