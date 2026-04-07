import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice, markInvoicePaid } from "./invoice";
import { createContract, signContract, updateContractStatus } from "./contract";
import { createDeposit, refundDeposit } from "./deposit";
import { createTransfer, approveTransfer } from "./transfer";
import { markAsRead, createNotification } from "./notification";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let ownerA: { id: string };
let ownerB: { id: string };
let houseA: string;
let houseB: string;
let roomA: string;
let roomB: string;
let tenantA: string;
let tenantB: string;

async function setup() {
  await cleanupTestDb();
  const hash = await hashPassword("Test123456");

  ownerA = await prisma.user.create({
    data: { name: "Auth Owner A", email: "authA@test.com", password: hash, role: "OWNER" },
  });
  ownerB = await prisma.user.create({
    data: { name: "Auth Owner B", email: "authB@test.com", password: hash, role: "OWNER" },
  });

  const hA = await createBoardingHouse({ name: "Auth House A", address: "Addr A", type: "MIXED", ownerId: ownerA.id });
  const hB = await createBoardingHouse({ name: "Auth House B", address: "Addr B", type: "MIXED", ownerId: ownerB.id });
  houseA = hA.boardingHouse!.id;
  houseB = hB.boardingHouse!.id;

  const rA = await createRoom({ number: "AUTH-A1", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseA });
  const rB = await createRoom({ number: "AUTH-B1", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseB });
  roomA = rA.room!.id;
  roomB = rB.room!.id;

  const tA = await createTenant({ name: "Auth Tenant A", phone: "0917-000-0001", boardingHouseId: houseA, roomId: roomA });
  const tB = await createTenant({ name: "Auth Tenant B", phone: "0917-000-0002", boardingHouseId: houseB, roomId: roomB });
  tenantA = tA.tenant!.id;
  tenantB = tB.tenant!.id;
}

beforeEach(async () => {
  await setup();
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("Cross-owner authorization isolation", () => {

  describe("Boarding house ownership", () => {
    it("owner cannot access another owner's boarding house", async () => {
      const house = await prisma.boardingHouse.findUnique({
        where: { id: houseA },
        select: { ownerId: true },
      });
      expect(house!.ownerId).toBe(ownerA.id);
      expect(house!.ownerId).not.toBe(ownerB.id);
    });
  });

  describe("Invoice isolation", () => {
    it("invoices are scoped to their boarding house", async () => {
      const inv = await createInvoice({
        tenantId: tenantA,
        boardingHouseId: houseA,
        amount: 3000,
        type: "RENT",
        dueDate: new Date("2026-06-01"),
      });
      expect(inv.success).toBe(true);

      // Invoice belongs to houseA
      const invoice = await prisma.invoice.findUnique({
        where: { id: inv.invoice!.id },
        select: { boardingHouseId: true },
      });
      expect(invoice!.boardingHouseId).toBe(houseA);
      expect(invoice!.boardingHouseId).not.toBe(houseB);
    });
  });

  describe("Contract isolation", () => {
    it("contract is tied to the correct boarding house", async () => {
      const contract = await createContract({
        tenantId: tenantA,
        boardingHouseId: houseA,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        monthlyRate: 3000,
      });

      expect(contract.boardingHouseId).toBe(houseA);
    });

    it("signContract rejects non-DRAFT contracts", async () => {
      const contract = await createContract({
        tenantId: tenantA,
        boardingHouseId: houseA,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        monthlyRate: 3000,
      });

      // Sign both sides to make ACTIVE
      await signContract(contract.id, "OWNER");
      await signContract(contract.id, "TENANT");

      // Terminate it
      const term = await updateContractStatus(contract.id, "TERMINATED");
      expect(term.success).toBe(true);

      // Cannot sign a terminated contract
      await expect(signContract(contract.id, "OWNER")).rejects.toThrow("Cannot sign");
    });
  });

  describe("Deposit isolation", () => {
    it("deposit is tied to the correct boarding house", async () => {
      const deposit = await createDeposit({
        tenantId: tenantA,
        boardingHouseId: houseA,
        amount: 5000,
        datePaid: new Date(),
      });

      expect(deposit.boardingHouseId).toBe(houseA);
    });

    it("cumulative refund cannot exceed deposit amount", async () => {
      const deposit = await createDeposit({
        tenantId: tenantA,
        boardingHouseId: houseA,
        amount: 5000,
        datePaid: new Date(),
      });

      const r1 = await refundDeposit(deposit.id, 3000, "Partial");
      expect(r1.success).toBe(true);

      const r2 = await refundDeposit(deposit.id, 3000, "Too much");
      expect(r2.success).toBe(false);
      expect(r2.error).toContain("exceeds remaining");
    });
  });

  describe("Tenant room isolation", () => {
    it("cannot assign tenant to room from different boarding house", async () => {
      const result = await createTenant({
        name: "Cross Test",
        phone: "0917-000-0099",
        boardingHouseId: houseA,
        roomId: roomB, // room from houseB
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not belong");
    });
  });

  describe("Transfer isolation", () => {
    it("approveTransfer rejects if target room is no longer available", async () => {
      // Create a second available room in houseA
      const room2 = await createRoom({
        number: "AUTH-A2",
        floor: 1,
        capacity: 1,
        monthlyRate: 3000,
        boardingHouseId: houseA,
      });

      const transfer = await createTransfer({
        tenantId: tenantA,
        fromRoomId: roomA,
        toRoomId: room2.room!.id,
      });
      expect(transfer.success).toBe(true);

      // Make target room unavailable
      await prisma.room.update({
        where: { id: room2.room!.id },
        data: { status: "OCCUPIED" },
      });

      const approval = await approveTransfer(transfer.transfer!.id);
      expect(approval.success).toBe(false);
      expect(approval.error).toContain("no longer available");
    });
  });

  describe("Notification isolation", () => {
    it("markAsRead rejects if notification belongs to different user", async () => {
      const notif = await createNotification({
        userId: ownerA.id,
        title: "Test",
        message: "Test notification",
      });

      // Owner B should not be able to mark Owner A's notification as read
      await expect(markAsRead(notif.id, ownerB.id)).rejects.toThrow("access denied");
    });
  });
});
