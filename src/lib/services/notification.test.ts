import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  sendInvoiceNotification,
  prepareInvoiceNotificationData,
} from "./notification";
import { createBoardingHouse } from "@/lib/actions/boarding-house";
import { createRoom } from "@/lib/actions/room";
import { createTenant } from "@/lib/actions/tenant";
import { createInvoice } from "@/lib/actions/invoice";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let invoiceId: string;
let tenantId: string;

async function seed() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({
    name: "Casa Marina Residences", address: "Brgy. Sainz", type: "ALL_FEMALE", ownerId: owner.id,
  });
  const room = await createRoom({
    number: "204", floor: 2, capacity: 2, monthlyRate: 3500, boardingHouseId: house.boardingHouse!.id,
  });
  const tenant = await createTenant({
    name: "Maria Santos", phone: "0917-123-4567", email: "maria@email.com",
    boardingHouseId: house.boardingHouse!.id, roomId: room.room!.id,
  });
  tenantId = tenant.tenant!.id;
  const inv = await createInvoice({
    tenantId, boardingHouseId: house.boardingHouse!.id,
    amount: 3500, type: "RENT", dueDate: new Date("2026-05-05"),
  });
  invoiceId = inv.invoice!.id;
}

describe("Notification Dispatcher", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("prepareInvoiceNotificationData", () => {
    it("assembles all needed data from an invoice ID", async () => {
      const data = await prepareInvoiceNotificationData(invoiceId);

      expect(data).not.toBeNull();
      expect(data!.invoiceNumber).toMatch(/^PH-/);
      expect(data!.tenantName).toBe("Maria Santos");
      expect(data!.tenantEmail).toBe("maria@email.com");
      expect(data!.tenantPhone).toBe("0917-123-4567");
      expect(data!.boardingHouseName).toBe("Casa Marina Residences");
      expect(data!.roomNumber).toBe("204");
      expect(data!.amount).toBe(3500);
      expect(data!.type).toBe("RENT");
    });

    it("returns null for non-existent invoice", async () => {
      const data = await prepareInvoiceNotificationData("fake-id");
      expect(data).toBeNull();
    });
  });

  describe("sendInvoiceNotification", () => {
    it("updates invoice sentVia and sentAt after EMAIL send", async () => {
      // Use dry-run mode (no actual sending)
      const result = await sendInvoiceNotification(invoiceId, "EMAIL", { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.channels).toContain("EMAIL");

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(invoice!.sentVia).toBe("EMAIL");
      expect(invoice!.sentAt).not.toBeNull();
    });

    it("updates invoice sentVia for SMS", async () => {
      const result = await sendInvoiceNotification(invoiceId, "SMS", { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.channels).toContain("SMS");

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(invoice!.sentVia).toBe("SMS");
    });

    it("updates invoice sentVia for BOTH", async () => {
      const result = await sendInvoiceNotification(invoiceId, "BOTH", { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.channels).toContain("EMAIL");
      expect(result.channels).toContain("SMS");

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(invoice!.sentVia).toBe("BOTH");
    });

    it("skips EMAIL if tenant has no email", async () => {
      await prisma.tenant.update({ where: { id: tenantId }, data: { email: null } });

      const result = await sendInvoiceNotification(invoiceId, "EMAIL", { dryRun: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain("no email");
    });

    it("skips SMS if tenant has invalid phone", async () => {
      await prisma.tenant.update({ where: { id: tenantId }, data: { phone: "invalid" } });

      const result = await sendInvoiceNotification(invoiceId, "SMS", { dryRun: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain("no valid phone");
    });

    it("returns error for non-existent invoice", async () => {
      const result = await sendInvoiceNotification("fake-id", "EMAIL", { dryRun: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("sends EMAIL only when BOTH requested but phone invalid", async () => {
      await prisma.tenant.update({ where: { id: tenantId }, data: { phone: "bad" } });

      const result = await sendInvoiceNotification(invoiceId, "BOTH", { dryRun: true });
      // Should still succeed because EMAIL channel works
      expect(result.success).toBe(true);
      expect(result.channels).toContain("EMAIL");
      expect(result.channels).not.toContain("SMS");
    });

    it("sends SMS only when BOTH requested but email missing", async () => {
      await prisma.tenant.update({ where: { id: tenantId }, data: { email: null } });

      const result = await sendInvoiceNotification(invoiceId, "BOTH", { dryRun: true });
      expect(result.success).toBe(true);
      expect(result.channels).toContain("SMS");
      expect(result.channels).not.toContain("EMAIL");
    });

    it("fails when BOTH requested but both email and phone invalid", async () => {
      await prisma.tenant.update({ where: { id: tenantId }, data: { email: null, phone: "bad" } });

      const result = await sendInvoiceNotification(invoiceId, "BOTH", { dryRun: true });
      expect(result.success).toBe(false);
    });

    it("includes correct sentAt timestamp", async () => {
      const before = new Date();
      await sendInvoiceNotification(invoiceId, "EMAIL", { dryRun: true });
      const after = new Date();

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      expect(invoice!.sentAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(invoice!.sentAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
