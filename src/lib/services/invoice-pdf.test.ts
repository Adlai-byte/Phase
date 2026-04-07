import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createBoardingHouse } from "@/lib/actions/boarding-house";
import { createRoom } from "@/lib/actions/room";
import { createTenant } from "@/lib/actions/tenant";
import { createInvoice } from "@/lib/actions/invoice";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let invoiceId: string;

beforeEach(async () => {
  await cleanupTestDb();
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({
    data: { name: "PDF Owner", email: "pdf@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({
    name: "PDF Test House",
    address: "123 Test St, Mati City",
    type: "MIXED",
    ownerId: owner.id,
    contactPhone: "0917-000-0000",
    contactEmail: "house@test.com",
  });
  const room = await createRoom({
    number: "PDF-1",
    floor: 1,
    capacity: 1,
    monthlyRate: 5000,
    boardingHouseId: house.boardingHouse!.id,
  });
  const tenant = await createTenant({
    name: "PDF Tenant",
    phone: "0917-111-0000",
    boardingHouseId: house.boardingHouse!.id,
    roomId: room.room!.id,
  });
  const invoice = await createInvoice({
    tenantId: tenant.tenant!.id,
    boardingHouseId: house.boardingHouse!.id,
    amount: 5000,
    type: "RENT",
    dueDate: new Date("2026-06-01"),
    description: "Rent for June 2026",
  });
  invoiceId = invoice.invoice!.id;
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("generateInvoicePDF", () => {
  it("returns a Buffer for a valid invoice", async () => {
    const { generateInvoicePDF } = await import("./invoice-pdf");
    const buffer = await generateInvoicePDF(invoiceId);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });

  it("throws for non-existent invoice", async () => {
    const { generateInvoicePDF } = await import("./invoice-pdf");
    await expect(generateInvoicePDF("nonexistent-id")).rejects.toThrow("Invoice not found");
  });
});
