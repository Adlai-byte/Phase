import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createReminderConfig, getReminderConfigs, processReminders, getOverdueTenants } from "./reminder";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice } from "./invoice";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;
let tenantId: string;
let ownerId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({ data: { name: "Owner", email: "o@t.com", password: hash, role: "OWNER" } });
  ownerId = owner.id;
  await prisma.subscription.create({ data: { plan: "PROFESSIONAL", maxRooms: 30, maxTenants: 50, emailSms: true, analytics: true, amount: 999, userId: owner.id } });
  const h = await createBoardingHouse({ name: "House", address: "A", type: "MIXED", ownerId: owner.id });
  houseId = h.boardingHouse!.id;
  const r = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
  const t = await createTenant({ name: "Maria", phone: "0917-123-4567", email: "maria@test.com", boardingHouseId: houseId, roomId: r.room!.id });
  tenantId = t.tenant!.id;
}

describe("Automated Reminders", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  describe("createReminderConfig", () => {
    it("creates a reminder config", async () => {
      const config = await createReminderConfig({
        boardingHouseId: houseId,
        name: "3 Days Before Due",
        triggerType: "BEFORE_DUE",
        triggerDays: 3,
        channel: "EMAIL",
        templateBody: "Hi {{tenantName}}, your invoice {{invoiceNumber}} for {{amount}} is due in {{days}} days.",
      });
      expect(config.id).toBeDefined();
      expect(config.triggerType).toBe("BEFORE_DUE");
      expect(config.enabled).toBe(true);
    });
  });

  describe("getReminderConfigs", () => {
    it("returns configs for a boarding house", async () => {
      await createReminderConfig({ boardingHouseId: houseId, name: "R1", triggerType: "BEFORE_DUE", triggerDays: 3, channel: "EMAIL", templateBody: "{{tenantName}}" });
      await createReminderConfig({ boardingHouseId: houseId, name: "R2", triggerType: "AFTER_DUE", triggerDays: 1, channel: "SMS", templateBody: "{{tenantName}}" });

      const configs = await getReminderConfigs(houseId);
      expect(configs).toHaveLength(2);
    });
  });

  describe("processReminders", () => {
    it("sends reminder for invoice due in 3 days (dry run)", async () => {
      await createReminderConfig({ boardingHouseId: houseId, name: "3 Before", triggerType: "BEFORE_DUE", triggerDays: 3, channel: "EMAIL", templateBody: "Due soon" });

      // Create invoice due in 3 days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });

      const result = await processReminders(houseId, { dryRun: true });
      expect(result.sent).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it("sends reminder for overdue invoice (dry run)", async () => {
      await createReminderConfig({ boardingHouseId: houseId, name: "1 After", triggerType: "AFTER_DUE", triggerDays: 1, channel: "EMAIL", templateBody: "Overdue!" });

      // Create invoice due yesterday
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 1);
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });

      const result = await processReminders(houseId, { dryRun: true });
      expect(result.sent).toBe(1);
    });

    it("does not send for already-paid invoices", async () => {
      await createReminderConfig({ boardingHouseId: houseId, name: "3 Before", triggerType: "BEFORE_DUE", triggerDays: 3, channel: "EMAIL", templateBody: "Due" });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      const inv = await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });
      await prisma.invoice.update({ where: { id: inv.invoice!.id }, data: { status: "PAID", paidDate: new Date() } });

      const result = await processReminders(houseId, { dryRun: true });
      expect(result.sent).toBe(0);
    });

    it("should not write ReminderLog rows during dry run", async () => {
      await createReminderConfig({ boardingHouseId: houseId, name: "3 Before", triggerType: "BEFORE_DUE", triggerDays: 3, channel: "EMAIL", templateBody: "Due soon" });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });

      const result = await processReminders(houseId, { dryRun: true });
      expect(result.sent).toBe(1);

      const logs = await prisma.reminderLog.findMany();
      expect(logs).toHaveLength(0);
    });

    it("should send reminders after a dry run without being blocked", async () => {
      await createReminderConfig({ boardingHouseId: houseId, name: "3 Before", triggerType: "BEFORE_DUE", triggerDays: 3, channel: "EMAIL", templateBody: "Due soon" });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });

      const dryResult = await processReminders(houseId, { dryRun: true });
      expect(dryResult.sent).toBe(1);

      const realResult = await processReminders(houseId);
      expect(realResult.sent).toBe(dryResult.sent);
    });

    it("skips disabled configs", async () => {
      const config = await createReminderConfig({ boardingHouseId: houseId, name: "Disabled", triggerType: "BEFORE_DUE", triggerDays: 3, channel: "EMAIL", templateBody: "Due" });
      await prisma.reminderConfig.update({ where: { id: config.id }, data: { enabled: false } });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });

      const result = await processReminders(houseId, { dryRun: true });
      expect(result.sent).toBe(0);
    });
  });

  describe("getOverdueTenants", () => {
    it("returns tenants with overdue invoices", async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);
      await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });

      const overdue = await getOverdueTenants(houseId);
      expect(overdue).toHaveLength(1);
      expect(overdue[0].tenant.name).toBe("Maria");
      expect(overdue[0].daysOverdue).toBeGreaterThanOrEqual(4);
    });

    it("excludes paid invoices", async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);
      const inv = await createInvoice({ tenantId, boardingHouseId: houseId, amount: 3000, type: "RENT", dueDate });
      await prisma.invoice.update({ where: { id: inv.invoice!.id }, data: { status: "PAID", paidDate: new Date() } });

      const overdue = await getOverdueTenants(houseId);
      expect(overdue).toHaveLength(0);
    });
  });
});
