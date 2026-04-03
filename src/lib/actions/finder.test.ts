import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { searchBoardingHouses } from "./finder";
import { createBoardingHouse } from "./boarding-house";
import { createRoom } from "./room";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

let ownerId: string;

async function seedPublicHouses() {
  const hash = await hashPassword("test123456");
  const owner = await prisma.user.create({
    data: { name: "Owner", email: "owner@test.com", password: hash, role: "OWNER" },
  });
  ownerId = owner.id;

  // House 1: Female, cheap, WiFi
  const h1 = await createBoardingHouse({
    name: "Casa Marina", address: "Brgy. Sainz", type: "ALL_FEMALE", ownerId,
    amenities: ["WiFi", "Kitchen", "CCTV"],
  });
  await prisma.boardingHouse.update({ where: { id: h1.boardingHouse!.id }, data: { published: true, verified: true } });
  await createRoom({ number: "101", floor: 1, capacity: 1, monthlyRate: 2500, boardingHouseId: h1.boardingHouse!.id });
  await createRoom({ number: "102", floor: 1, capacity: 1, monthlyRate: 2500, boardingHouseId: h1.boardingHouse!.id });

  // House 2: Male, mid-range, AC
  const h2 = await createBoardingHouse({
    name: "Blue Haven", address: "Brgy. Central", type: "ALL_MALE", ownerId,
    amenities: ["WiFi", "AC", "Gym"],
  });
  await prisma.boardingHouse.update({ where: { id: h2.boardingHouse!.id }, data: { published: true, verified: true } });
  await createRoom({ number: "201", floor: 1, capacity: 2, monthlyRate: 4000, boardingHouseId: h2.boardingHouse!.id });

  // House 3: Mixed, expensive
  const h3 = await createBoardingHouse({
    name: "Pacific View", address: "Brgy. Dahican", type: "MIXED", ownerId,
    amenities: ["WiFi", "AC", "Ocean View"],
  });
  await prisma.boardingHouse.update({ where: { id: h3.boardingHouse!.id }, data: { published: true, verified: true } });
  await createRoom({ number: "301", floor: 1, capacity: 1, monthlyRate: 5500, boardingHouseId: h3.boardingHouse!.id });

  // House 4: Draft (not published)
  await createBoardingHouse({ name: "Draft Place", address: "Brgy. Badas", type: "MIXED", ownerId });
}

describe("Boarding House Finder", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seedPublicHouses();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("returns only published & verified houses", async () => {
    const results = await searchBoardingHouses({});
    expect(results).toHaveLength(3); // excludes Draft Place
  });

  it("filters by type ALL_FEMALE", async () => {
    const results = await searchBoardingHouses({ type: "ALL_FEMALE" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Casa Marina");
  });

  it("filters by type ALL_MALE", async () => {
    const results = await searchBoardingHouses({ type: "ALL_MALE" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Blue Haven");
  });

  it("filters by max price", async () => {
    const results = await searchBoardingHouses({ maxPrice: 3000 });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Casa Marina");
  });

  it("searches by name", async () => {
    const results = await searchBoardingHouses({ search: "Pacific" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Pacific View");
  });

  it("searches by address/barangay", async () => {
    const results = await searchBoardingHouses({ search: "Dahican" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Pacific View");
  });

  it("combines type + price filters", async () => {
    const results = await searchBoardingHouses({ type: "ALL_MALE", maxPrice: 3000 });
    expect(results).toHaveLength(0); // Blue Haven is 4000
  });

  it("includes room count and min price in results", async () => {
    const results = await searchBoardingHouses({});
    const casa = results.find((r) => r.name === "Casa Marina");
    expect(casa!.totalRooms).toBe(2);
    expect(casa!.minRate).toBe(2500);
  });

  it("returns empty array when no matches", async () => {
    const results = await searchBoardingHouses({ search: "Nonexistent" });
    expect(results).toEqual([]);
  });
});
