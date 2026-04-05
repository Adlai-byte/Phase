import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createDeposit, getDepositsByTenant, refundDeposit } from "./deposit";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let houseId: string;
let tenantId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({ data: { name: "Owner", email: "o@t.com", password: hash, role: "OWNER" } });
  const h = await createBoardingHouse({ name: "H", address: "A", type: "MIXED", ownerId: owner.id });
  houseId = h.boardingHouse!.id;
  const r = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: houseId });
  const t = await createTenant({ name: "Maria", phone: "0917-111", boardingHouseId: houseId, roomId: r.room!.id });
  tenantId = t.tenant!.id;
}

describe("Deposit", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  it("creates a deposit", async () => {
    const d = await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date("2026-04-01"), conditions: "Non-refundable if lease broken" });
    expect(d.id).toBeDefined();
    expect(d.amount).toBe(5000);
    expect(d.refundStatus).toBe("HELD");
  });

  it("gets deposits by tenant", async () => {
    await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date() });
    await createDeposit({ tenantId, boardingHouseId: houseId, amount: 2000, datePaid: new Date() });
    const deposits = await getDepositsByTenant(tenantId);
    expect(deposits).toHaveLength(2);
  });

  it("refunds a deposit partially", async () => {
    const d = await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date() });
    const result = await refundDeposit(d.id, 3000, "Deducted for damages");
    expect(result.success).toBe(true);
    expect(result.deposit!.refundStatus).toBe("PARTIALLY_REFUNDED");
    expect(result.deposit!.refundAmount).toBe(3000);
  });

  it("refunds fully", async () => {
    const d = await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date() });
    const result = await refundDeposit(d.id, 5000, "Full refund on checkout");
    expect(result.success).toBe(true);
    expect(result.deposit!.refundStatus).toBe("FULLY_REFUNDED");
  });

  it("rejects refund exceeding deposit", async () => {
    const d = await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date() });
    const result = await refundDeposit(d.id, 6000, "Too much");
    expect(result.success).toBe(false);
    expect(result.error).toContain("exceed");
  });

  it("rejects refunding already-refunded deposit", async () => {
    const d = await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date() });
    await refundDeposit(d.id, 5000, "Full");
    const result = await refundDeposit(d.id, 1000, "Again");
    expect(result.success).toBe(false);
  });

  it("should track cumulative refunds and reject when exceeding deposit amount", async () => {
    const d = await createDeposit({ tenantId, boardingHouseId: houseId, amount: 5000, datePaid: new Date() });

    // First partial refund of 3000 — should succeed, status PARTIALLY_REFUNDED
    const r1 = await refundDeposit(d.id, 3000, "Partial refund #1");
    expect(r1.success).toBe(true);
    expect(r1.deposit!.refundStatus).toBe("PARTIALLY_REFUNDED");
    expect(r1.deposit!.refundAmount).toBe(3000);

    // Second attempt for 3000 — should fail because only 2000 remaining
    const r2 = await refundDeposit(d.id, 3000, "Partial refund #2");
    expect(r2.success).toBe(false);
    expect(r2.error).toContain("exceeds remaining");

    // Third attempt for 2000 (the actual remaining) — should succeed, status FULLY_REFUNDED
    const r3 = await refundDeposit(d.id, 2000, "Final refund");
    expect(r3.success).toBe(true);
    expect(r3.deposit!.refundStatus).toBe("FULLY_REFUNDED");
    expect(r3.deposit!.refundAmount).toBe(5000);
  });
});
