import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { createTenant } from "./tenant";
import { createInvoice } from "./invoice";

// We can't import the server action directly (it uses cookies/headers)
// so we test the underlying query logic by creating a standalone search function
// that mirrors globalSearch but accepts userId instead of reading from session
async function searchForUser(userId: string, query: string) {
  const houses = await prisma.boardingHouse.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const houseIds = houses.map((h) => h.id);
  if (houseIds.length === 0 || query.length < 2) return [];

  const results: { type: string; id: string; title: string }[] = [];

  const tenants = await prisma.tenant.findMany({
    where: {
      boardingHouseId: { in: houseIds },
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ],
    },
    take: 5,
  });
  for (const t of tenants) {
    results.push({ type: "tenant", id: t.id, title: t.name });
  }

  const rooms = await prisma.room.findMany({
    where: { boardingHouseId: { in: houseIds }, number: { contains: query } },
    take: 5,
  });
  for (const r of rooms) {
    results.push({ type: "room", id: r.id, title: `Room ${r.number}` });
  }

  const invoices = await prisma.invoice.findMany({
    where: { boardingHouseId: { in: houseIds }, invoiceNumber: { contains: query } },
    take: 5,
  });
  for (const i of invoices) {
    results.push({ type: "invoice", id: i.id, title: i.invoiceNumber });
  }

  return results;
}

let ownerAId: string;
let ownerBId: string;
let houseAId: string;

async function seed() {
  const hash = await hashPassword("Test123456");
  const ownerA = await prisma.user.create({
    data: { name: "Owner A", email: "ownerA@test.com", password: hash, role: "OWNER" },
  });
  const ownerB = await prisma.user.create({
    data: { name: "Owner B", email: "ownerB@test.com", password: hash, role: "OWNER" },
  });
  ownerAId = ownerA.id;
  ownerBId = ownerB.id;

  const hA = await createBoardingHouse({ name: "House A", address: "Addr A", type: "MIXED", ownerId: ownerAId });
  const hB = await createBoardingHouse({ name: "House B", address: "Addr B", type: "MIXED", ownerId: ownerBId });
  houseAId = hA.boardingHouse!.id;

  const roomA = await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 3000, boardingHouseId: hA.boardingHouse!.id });
  await createRoom({ number: "201", floor: 2, capacity: 1, monthlyRate: 4000, boardingHouseId: hB.boardingHouse!.id });

  const tA = await createTenant({ name: "Maria Santos", phone: "0917-111-0001", email: "maria@test.com", boardingHouseId: hA.boardingHouse!.id, roomId: roomA.room!.id });
  await createTenant({ name: "Maria Garcia", phone: "0917-222-0002", email: "garcia@test.com", boardingHouseId: hB.boardingHouse!.id });

  await createInvoice({ tenantId: tA.tenant!.id, boardingHouseId: hA.boardingHouse!.id, amount: 3000, type: "RENT", dueDate: new Date("2026-05-05") });
}

describe("Global Search", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seed();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("finds tenants by name", async () => {
    const results = await searchForUser(ownerAId, "Maria");
    const tenants = results.filter((r) => r.type === "tenant");
    expect(tenants).toHaveLength(1);
    expect(tenants[0].title).toBe("Maria Santos");
  });

  it("does NOT return other owner's tenants", async () => {
    const results = await searchForUser(ownerAId, "Garcia");
    expect(results).toHaveLength(0);
  });

  it("finds rooms by number", async () => {
    const results = await searchForUser(ownerAId, "101");
    const rooms = results.filter((r) => r.type === "room");
    expect(rooms).toHaveLength(1);
    expect(rooms[0].title).toBe("Room 101");
  });

  it("does NOT return other owner's rooms", async () => {
    const results = await searchForUser(ownerAId, "201");
    expect(results).toHaveLength(0);
  });

  it("finds invoices by number prefix", async () => {
    const results = await searchForUser(ownerAId, "PH-");
    const invoices = results.filter((r) => r.type === "invoice");
    expect(invoices).toHaveLength(1);
  });

  it("returns empty for short query", async () => {
    const results = await searchForUser(ownerAId, "M");
    expect(results).toHaveLength(0);
  });

  it("returns empty for owner with no houses", async () => {
    const hash = await hashPassword("Test123456");
    const newOwner = await prisma.user.create({
      data: { name: "Empty Owner", email: "empty@test.com", password: hash, role: "OWNER" },
    });
    const results = await searchForUser(newOwner.id, "Maria");
    expect(results).toHaveLength(0);
  });

  it("finds tenant by email", async () => {
    const results = await searchForUser(ownerAId, "maria@test");
    const tenants = results.filter((r) => r.type === "tenant");
    expect(tenants).toHaveLength(1);
  });

  it("finds tenant by phone", async () => {
    const results = await searchForUser(ownerAId, "0917-111");
    const tenants = results.filter((r) => r.type === "tenant");
    expect(tenants).toHaveLength(1);
  });
});
