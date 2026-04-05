import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createAnnouncement, getAnnouncements, markAnnouncementRead, getUnreadAnnouncementCount } from "./announcement";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let adminId: string;
let ownerId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const admin = await prisma.user.create({ data: { name: "Admin", email: "admin@test.com", password: hash, role: "SUPERADMIN" } });
  const owner = await prisma.user.create({ data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" } });
  adminId = admin.id;
  ownerId = owner.id;
}

describe("Broadcast Announcements", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  describe("createAnnouncement", () => {
    it("creates an announcement", async () => {
      const a = await createAnnouncement({ title: "Maintenance", message: "System will be down 2AM-4AM", type: "MAINTENANCE", createdById: adminId });
      expect(a.id).toBeDefined();
      expect(a.title).toBe("Maintenance");
      expect(a.type).toBe("MAINTENANCE");
    });

    it("targets specific plan", async () => {
      const a = await createAnnouncement({ title: "Pro Feature", message: "New analytics!", type: "UPDATE", createdById: adminId, targetPlan: "PROFESSIONAL" });
      expect(a.targetPlan).toBe("PROFESSIONAL");
    });
  });

  describe("getAnnouncements", () => {
    it("returns all announcements for owner", async () => {
      await createAnnouncement({ title: "A1", message: "m1", createdById: adminId });
      await createAnnouncement({ title: "A2", message: "m2", createdById: adminId });

      const list = await getAnnouncements(ownerId);
      expect(list).toHaveLength(2);
    });

    it("filters by plan when owner has subscription", async () => {
      await prisma.subscription.create({ data: { plan: "STARTER", maxRooms: 10, maxTenants: 15, emailSms: false, analytics: false, amount: 0, userId: ownerId } });
      await createAnnouncement({ title: "For All", message: "m", createdById: adminId });
      await createAnnouncement({ title: "Pro Only", message: "m", createdById: adminId, targetPlan: "PROFESSIONAL" });
      await createAnnouncement({ title: "Starter Only", message: "m", createdById: adminId, targetPlan: "STARTER" });

      const list = await getAnnouncements(ownerId);
      expect(list).toHaveLength(2); // "For All" + "Starter Only"
      expect(list.map((a: any) => a.title).sort()).toEqual(["For All", "Starter Only"]);
    });

    it("shows read status", async () => {
      const a = await createAnnouncement({ title: "Test", message: "m", createdById: adminId });
      await markAnnouncementRead(a.id, ownerId);

      const list = await getAnnouncements(ownerId);
      expect(list[0].isRead).toBe(true);
    });
  });

  describe("getUnreadAnnouncementCount", () => {
    it("counts unread announcements", async () => {
      await createAnnouncement({ title: "A1", message: "m", createdById: adminId });
      await createAnnouncement({ title: "A2", message: "m", createdById: adminId });

      const count = await getUnreadAnnouncementCount(ownerId);
      expect(count).toBe(2);
    });

    it("decreases after reading", async () => {
      const a = await createAnnouncement({ title: "A1", message: "m", createdById: adminId });
      await createAnnouncement({ title: "A2", message: "m", createdById: adminId });
      await markAnnouncementRead(a.id, ownerId);

      const count = await getUnreadAnnouncementCount(ownerId);
      expect(count).toBe(1);
    });
  });
});
