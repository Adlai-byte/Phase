import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createContract, getContractsByTenant, updateContractStatus, signContract } from "./contract";
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

describe("Contract", () => {
  beforeEach(async () => { await cleanupTestDb(); await seed(); });
  afterAll(async () => { await disconnectTestDb(); });

  it("creates a contract as DRAFT", async () => {
    const c = await createContract({
      tenantId, boardingHouseId: houseId,
      startDate: new Date("2026-04-01"), endDate: new Date("2027-04-01"),
      monthlyRate: 3000, depositAmount: 5000, terms: "Standard 1-year lease",
    });
    expect(c.id).toBeDefined();
    expect(c.status).toBe("DRAFT");
  });

  it("rejects end date before start date", async () => {
    await expect(createContract({
      tenantId, boardingHouseId: houseId,
      startDate: new Date("2027-01-01"), endDate: new Date("2026-01-01"),
      monthlyRate: 3000,
    })).rejects.toThrow();
  });

  it("gets contracts by tenant", async () => {
    await createContract({ tenantId, boardingHouseId: houseId, startDate: new Date("2026-04-01"), endDate: new Date("2027-04-01"), monthlyRate: 3000 });
    const contracts = await getContractsByTenant(tenantId);
    expect(contracts).toHaveLength(1);
  });

  it("activates contract when both parties sign", async () => {
    const c = await createContract({ tenantId, boardingHouseId: houseId, startDate: new Date("2026-04-01"), endDate: new Date("2027-04-01"), monthlyRate: 3000 });
    await signContract(c.id, "OWNER");
    const result = await signContract(c.id, "TENANT");
    expect(result.status).toBe("ACTIVE");
    expect(result.signedByOwner).toBe(true);
    expect(result.signedByTenant).toBe(true);
    expect(result.signedDate).not.toBeNull();
  });

  it("stays DRAFT if only one party signs", async () => {
    const c = await createContract({ tenantId, boardingHouseId: houseId, startDate: new Date("2026-04-01"), endDate: new Date("2027-04-01"), monthlyRate: 3000 });
    const result = await signContract(c.id, "OWNER");
    expect(result.status).toBe("DRAFT");
    expect(result.signedByOwner).toBe(true);
    expect(result.signedByTenant).toBe(false);
  });

  it("terminates an active contract", async () => {
    const c = await createContract({ tenantId, boardingHouseId: houseId, startDate: new Date("2026-04-01"), endDate: new Date("2027-04-01"), monthlyRate: 3000 });
    await signContract(c.id, "OWNER");
    await signContract(c.id, "TENANT");
    const result = await updateContractStatus(c.id, "TERMINATED");
    expect(result.success).toBe(true);
    expect(result.contract!.status).toBe("TERMINATED");
  });

  it("rejects invalid status transition", async () => {
    const c = await createContract({ tenantId, boardingHouseId: houseId, startDate: new Date("2026-04-01"), endDate: new Date("2027-04-01"), monthlyRate: 3000 });
    // Cannot terminate a DRAFT contract
    const result = await updateContractStatus(c.id, "TERMINATED");
    expect(result.success).toBe(false);
  });
});
