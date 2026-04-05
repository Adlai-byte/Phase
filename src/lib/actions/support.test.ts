import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createSupportTicket, getTickets, resolveTicket, getTicketsByUser } from "./support";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let ownerId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({ data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" } });
  ownerId = owner.id;
}

describe("Support Tickets", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  describe("createSupportTicket", () => {
    it("creates a ticket", async () => {
      const ticket = await createSupportTicket({ userId: ownerId, subject: "Can't add rooms", message: "I get an error when trying to add a room", priority: "HIGH" });
      expect(ticket.id).toBeDefined();
      expect(ticket.status).toBe("OPEN");
      expect(ticket.priority).toBe("HIGH");
    });

    it("defaults to NORMAL priority", async () => {
      const ticket = await createSupportTicket({ userId: ownerId, subject: "Question", message: "How do I export?" });
      expect(ticket.priority).toBe("NORMAL");
    });
  });

  describe("getTickets", () => {
    it("returns all tickets for admin", async () => {
      await createSupportTicket({ userId: ownerId, subject: "T1", message: "m1" });
      await createSupportTicket({ userId: ownerId, subject: "T2", message: "m2" });

      const tickets = await getTickets({});
      expect(tickets).toHaveLength(2);
    });

    it("filters by status", async () => {
      const t = await createSupportTicket({ userId: ownerId, subject: "T1", message: "m1" });
      await createSupportTicket({ userId: ownerId, subject: "T2", message: "m2" });
      await resolveTicket(t.id, "Fixed the issue");

      const open = await getTickets({ status: "OPEN" });
      expect(open).toHaveLength(1);
      expect(open[0].subject).toBe("T2");
    });

    it("includes user info", async () => {
      await createSupportTicket({ userId: ownerId, subject: "T1", message: "m1" });
      const tickets = await getTickets({});
      expect(tickets[0].user.name).toBe("Owner");
    });
  });

  describe("getTicketsByUser", () => {
    it("returns only user's tickets", async () => {
      const hash = await hashPassword("Test123456");
      const other = await prisma.user.create({ data: { name: "Other", email: "other@test.com", password: hash, role: "OWNER" } });
      await createSupportTicket({ userId: ownerId, subject: "Mine", message: "m" });
      await createSupportTicket({ userId: other.id, subject: "Theirs", message: "m" });

      const tickets = await getTicketsByUser(ownerId);
      expect(tickets).toHaveLength(1);
      expect(tickets[0].subject).toBe("Mine");
    });
  });

  describe("resolveTicket", () => {
    it("marks ticket as resolved with response", async () => {
      const t = await createSupportTicket({ userId: ownerId, subject: "Bug", message: "m" });
      const resolved = await resolveTicket(t.id, "This has been fixed in the latest update");

      expect(resolved.status).toBe("RESOLVED");
      expect(resolved.response).toBe("This has been fixed in the latest update");
      expect(resolved.resolvedAt).not.toBeNull();
    });
  });
});
