import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "./notification";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let userId: string;

async function seedUser() {
  const hash = await hashPassword("test123456");
  const user = await prisma.user.create({
    data: { name: "Test Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  userId = user.id;
}

describe("Notification System", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seedUser();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("createNotification", () => {
    it("creates a notification", async () => {
      const notif = await createNotification({
        userId,
        title: "Payment Received",
        message: "Maria Santos paid ₱3,500 for Room 204",
        type: "PAYMENT",
        link: "/dashboard/invoices",
      });

      expect(notif.id).toBeDefined();
      expect(notif.title).toBe("Payment Received");
      expect(notif.read).toBe(false);
    });

    it("defaults to INFO type", async () => {
      const notif = await createNotification({
        userId,
        title: "Welcome",
        message: "Welcome to Phase!",
      });

      expect(notif.type).toBe("INFO");
    });
  });

  describe("getNotifications", () => {
    it("returns notifications ordered by newest first", async () => {
      await createNotification({ userId, title: "First", message: "1" });
      await createNotification({ userId, title: "Second", message: "2" });
      await createNotification({ userId, title: "Third", message: "3" });

      const notifs = await getNotifications(userId);
      expect(notifs).toHaveLength(3);
      expect(notifs[0].title).toBe("Third");
      expect(notifs[2].title).toBe("First");
    });

    it("limits results", async () => {
      for (let i = 0; i < 15; i++) {
        await createNotification({ userId, title: `N${i}`, message: `msg${i}` });
      }

      const notifs = await getNotifications(userId, 10);
      expect(notifs).toHaveLength(10);
    });

    it("returns empty for user with no notifications", async () => {
      const notifs = await getNotifications(userId);
      expect(notifs).toEqual([]);
    });
  });

  describe("getUnreadCount", () => {
    it("counts unread notifications", async () => {
      await createNotification({ userId, title: "A", message: "a" });
      await createNotification({ userId, title: "B", message: "b" });
      const n3 = await createNotification({ userId, title: "C", message: "c" });
      await markAsRead(n3.id);

      const count = await getUnreadCount(userId);
      expect(count).toBe(2);
    });

    it("returns 0 when all read", async () => {
      const n = await createNotification({ userId, title: "A", message: "a" });
      await markAsRead(n.id);

      const count = await getUnreadCount(userId);
      expect(count).toBe(0);
    });
  });

  describe("markAsRead", () => {
    it("marks a single notification as read", async () => {
      const n = await createNotification({ userId, title: "Test", message: "test" });
      expect(n.read).toBe(false);

      const updated = await markAsRead(n.id);
      expect(updated.read).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all user notifications as read", async () => {
      await createNotification({ userId, title: "A", message: "a" });
      await createNotification({ userId, title: "B", message: "b" });
      await createNotification({ userId, title: "C", message: "c" });

      const count = await markAllAsRead(userId);
      expect(count).toBe(3);

      const unread = await getUnreadCount(userId);
      expect(unread).toBe(0);
    });
  });
});
