import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { canCreateRoom, canCreateTenant, canSendNotification, getPlanLimits } from "./subscription";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let starterOwnerId: string;
let proOwnerId: string;
let enterpriseOwnerId: string;

async function seed() {
  const hash = await hashPassword("test123456");

  const starter = await prisma.user.create({
    data: { name: "Starter", email: "starter@test.com", password: hash, role: "OWNER" },
  });
  await prisma.subscription.create({
    data: { plan: "STARTER", maxRooms: 10, maxTenants: 15, emailSms: false, analytics: false, amount: 0, userId: starter.id },
  });
  starterOwnerId = starter.id;

  const pro = await prisma.user.create({
    data: { name: "Pro", email: "pro@test.com", password: hash, role: "OWNER" },
  });
  await prisma.subscription.create({
    data: { plan: "PROFESSIONAL", maxRooms: 30, maxTenants: 50, emailSms: true, analytics: true, amount: 999, userId: pro.id },
  });
  proOwnerId = pro.id;

  const enterprise = await prisma.user.create({
    data: { name: "Enterprise", email: "enterprise@test.com", password: hash, role: "OWNER" },
  });
  await prisma.subscription.create({
    data: { plan: "ENTERPRISE", maxRooms: 9999, maxTenants: 9999, emailSms: true, analytics: true, amount: 2499, userId: enterprise.id },
  });
  enterpriseOwnerId = enterprise.id;
}

describe("Subscription Enforcement", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("getPlanLimits", () => {
    it("returns limits for starter plan", async () => {
      const limits = await getPlanLimits(starterOwnerId);
      expect(limits!.maxRooms).toBe(10);
      expect(limits!.emailSms).toBe(false);
      expect(limits!.analytics).toBe(false);
    });

    it("returns limits for professional plan", async () => {
      const limits = await getPlanLimits(proOwnerId);
      expect(limits!.maxRooms).toBe(30);
      expect(limits!.emailSms).toBe(true);
    });

    it("returns null for user without subscription", async () => {
      const hash = await hashPassword("test123456");
      const noSub = await prisma.user.create({
        data: { name: "NoSub", email: "nosub@test.com", password: hash, role: "OWNER" },
      });
      const limits = await getPlanLimits(noSub.id);
      expect(limits).toBeNull();
    });
  });

  describe("canCreateRoom", () => {
    it("allows when under limit", async () => {
      const house = await createBoardingHouse({ name: "H", address: "A", type: "MIXED", ownerId: starterOwnerId });
      await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: house.boardingHouse!.id });

      const result = await canCreateRoom(starterOwnerId);
      expect(result.allowed).toBe(true);
    });

    it("blocks when at limit", async () => {
      const house = await createBoardingHouse({ name: "H", address: "A", type: "MIXED", ownerId: starterOwnerId });
      // Create 10 rooms (starter limit)
      for (let i = 1; i <= 10; i++) {
        await createRoom({ number: `${i}`, floor: 1, capacity: 1, monthlyRate: 2000, boardingHouseId: house.boardingHouse!.id });
      }

      const result = await canCreateRoom(starterOwnerId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("limit");
    });
  });

  describe("canCreateTenant", () => {
    it("allows when under limit", async () => {
      const house = await createBoardingHouse({ name: "H", address: "A", type: "MIXED", ownerId: starterOwnerId });
      await createTenant({ name: "T1", phone: "0917-111-0001", boardingHouseId: house.boardingHouse!.id });

      const result = await canCreateTenant(starterOwnerId);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
      expect(result.limit).toBe(15);
    });

    it("blocks when at limit", async () => {
      const house = await createBoardingHouse({ name: "H", address: "A", type: "MIXED", ownerId: starterOwnerId });
      for (let i = 1; i <= 15; i++) {
        await createTenant({ name: `T${i}`, phone: `0917-000-${String(i).padStart(4, "0")}`, boardingHouseId: house.boardingHouse!.id });
      }

      const result = await canCreateTenant(starterOwnerId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("limit");
    });

    it("returns not allowed for user without subscription", async () => {
      const hash = await hashPassword("Test123456");
      const noSub = await prisma.user.create({
        data: { name: "NoSub", email: "nosub2@test.com", password: hash, role: "OWNER" },
      });
      const result = await canCreateTenant(noSub.id);
      expect(result.allowed).toBe(false);
    });
  });

  describe("canSendNotification", () => {
    it("blocks starter from email/SMS", async () => {
      const result = await canSendNotification(starterOwnerId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("upgrade");
    });

    it("allows professional to send", async () => {
      const result = await canSendNotification(proOwnerId);
      expect(result.allowed).toBe(true);
    });

    it("allows enterprise to send", async () => {
      const result = await canSendNotification(enterpriseOwnerId);
      expect(result.allowed).toBe(true);
    });
  });
});
