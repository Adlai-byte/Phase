import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createAuditEntry, getAuditLogs } from "./audit";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let userId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const user = await prisma.user.create({
    data: { name: "Admin", email: "admin@test.com", password: hash, role: "SUPERADMIN" },
  });
  userId = user.id;
}

describe("Audit Log", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  describe("createAuditEntry", () => {
    it("creates an audit log entry", async () => {
      const entry = await createAuditEntry({
        userId, action: "VERIFY_OWNER", entityType: "User", entityId: "owner-1",
        details: JSON.stringify({ ownerEmail: "test@test.com" }),
      });
      expect(entry.id).toBeDefined();
      expect(entry.action).toBe("VERIFY_OWNER");
      expect(entry.entityType).toBe("User");
    });

    it("stores IP address", async () => {
      const entry = await createAuditEntry({
        userId, action: "LOGIN", ipAddress: "192.168.1.1",
      });
      expect(entry.ipAddress).toBe("192.168.1.1");
    });
  });

  describe("getAuditLogs", () => {
    it("returns logs ordered by newest first", async () => {
      await createAuditEntry({ userId, action: "FIRST" });
      await createAuditEntry({ userId, action: "SECOND" });
      await createAuditEntry({ userId, action: "THIRD" });

      const logs = await getAuditLogs({});
      expect(logs).toHaveLength(3);
      expect(logs[0].action).toBe("THIRD");
    });

    it("filters by action", async () => {
      await createAuditEntry({ userId, action: "LOGIN" });
      await createAuditEntry({ userId, action: "VERIFY_OWNER" });
      await createAuditEntry({ userId, action: "LOGIN" });

      const logs = await getAuditLogs({ action: "LOGIN" });
      expect(logs).toHaveLength(2);
    });

    it("filters by userId", async () => {
      const hash = await hashPassword("Test123456");
      const other = await prisma.user.create({
        data: { name: "Other", email: "other@test.com", password: hash, role: "OWNER" },
      });
      await createAuditEntry({ userId, action: "ADMIN_ACTION" });
      await createAuditEntry({ userId: other.id, action: "OWNER_ACTION" });

      const logs = await getAuditLogs({ userId });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("ADMIN_ACTION");
    });

    it("filters by entityType", async () => {
      await createAuditEntry({ userId, action: "PAY", entityType: "Invoice", entityId: "inv-1" });
      await createAuditEntry({ userId, action: "CREATE", entityType: "Tenant", entityId: "t-1" });

      const logs = await getAuditLogs({ entityType: "Invoice" });
      expect(logs).toHaveLength(1);
    });

    it("limits results", async () => {
      for (let i = 0; i < 20; i++) {
        await createAuditEntry({ userId, action: `ACTION_${i}` });
      }
      const logs = await getAuditLogs({ limit: 5 });
      expect(logs).toHaveLength(5);
    });

    it("includes user name", async () => {
      await createAuditEntry({ userId, action: "TEST" });
      const logs = await getAuditLogs({});
      expect(logs[0].user.name).toBe("Admin");
    });
  });
});
