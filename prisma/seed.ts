import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.roomTransfer.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.boardingHouse.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Superadmin
  const admin = await prisma.user.create({
    data: {
      name: "Phase Admin",
      email: "admin@phase.com",
      password: hashedPassword,
      role: "SUPERADMIN",
      verified: true,
      phone: "0917-000-0000",
    },
  });

  // Create Owner
  const owner = await prisma.user.create({
    data: {
      name: "Elena Magsaysay",
      email: "elena@phase.com",
      password: hashedPassword,
      role: "OWNER",
      verified: true,
      phone: "0917-111-2222",
    },
  });

  // Create Subscription for owner
  await prisma.subscription.create({
    data: {
      plan: "PROFESSIONAL",
      maxRooms: 30,
      maxTenants: 50,
      emailSms: true,
      analytics: true,
      amount: 999,
      userId: owner.id,
    },
  });

  // Create Boarding House
  const house = await prisma.boardingHouse.create({
    data: {
      name: "Casa Marina Residences",
      address: "Brgy. Sainz, Mati City",
      city: "Mati City",
      description:
        "A well-maintained all-female boarding house in the heart of Brgy. Sainz.",
      type: "ALL_FEMALE",
      verified: true,
      published: true,
      hasCurfew: true,
      curfewTime: "22:00",
      amenities: JSON.stringify(["WiFi", "CCTV", "Kitchen", "Laundry", "Study Area"]),
      restrictions: JSON.stringify(["No Pets", "No Visitors After 9PM"]),
      contactPhone: "0917-111-2222",
      contactEmail: "elena@phase.com",
      ownerId: owner.id,
    },
  });

  // Create Rooms
  const roomsData = [
    { number: "101", floor: 1, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "102", floor: 1, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "103", floor: 1, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "AVAILABLE" },
    { number: "104", floor: 1, capacity: 1, monthlyRate: 2500, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "105", floor: 1, capacity: 2, monthlyRate: 3000, hasAircon: true, hasWifi: true, hasBathroom: false, electricityIncluded: false, status: "OCCUPIED" },
    { number: "201", floor: 2, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "AVAILABLE" },
    { number: "202", floor: 2, capacity: 2, monthlyRate: 4000, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "MAINTENANCE" },
    { number: "203", floor: 2, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
    { number: "204", floor: 2, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "OCCUPIED" },
    { number: "301", floor: 3, capacity: 1, monthlyRate: 3000, hasAircon: true, hasWifi: true, hasBathroom: false, electricityIncluded: false, status: "OCCUPIED" },
    { number: "302", floor: 3, capacity: 2, monthlyRate: 3500, hasAircon: true, hasWifi: true, hasBathroom: true, electricityIncluded: false, status: "AVAILABLE" },
    { number: "305", floor: 3, capacity: 1, monthlyRate: 2800, hasAircon: false, hasWifi: true, hasBathroom: false, electricityIncluded: true, status: "OCCUPIED" },
  ];

  const rooms: Record<string, string> = {};
  for (const r of roomsData) {
    const room = await prisma.room.create({
      data: { ...r, boardingHouseId: house.id },
    });
    rooms[r.number] = room.id;
  }

  // Create Tenants
  const tenantsData = [
    { name: "Maria Santos", email: "maria@email.com", phone: "0917-123-4567", roomNumber: "204", status: "ACTIVE" },
    { name: "John Cruz", email: "john@email.com", phone: "0918-234-5678", roomNumber: "105", status: "ACTIVE" },
    { name: "Ana Reyes", email: "ana@email.com", phone: "0919-345-6789", roomNumber: "305", status: "ACTIVE" },
    { name: "Carlos Garcia", email: "carlos@email.com", phone: "0920-456-7890", roomNumber: "102", status: "ACTIVE" },
    { name: "Paolo Tan", email: "paolo@email.com", phone: "0924-890-1234", roomNumber: "104", status: "ACTIVE" },
    { name: "Grace Lim", email: "grace@email.com", phone: "0923-789-0123", roomNumber: "203", status: "ACTIVE" },
    { name: "Mark Rivera", email: "mark@email.com", phone: "0922-678-9012", roomNumber: "301", status: "ACTIVE" },
    { name: "Lisa Mendoza", email: "lisa@email.com", phone: "0921-567-8901", roomNumber: "101", status: "ACTIVE" },
  ];

  for (const t of tenantsData) {
    await prisma.tenant.create({
      data: {
        name: t.name,
        email: t.email,
        phone: t.phone,
        moveInDate: new Date("2025-06-15"),
        status: t.status,
        roomId: rooms[t.roomNumber],
        boardingHouseId: house.id,
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Admin: admin@phase.com / password123");
  console.log("  Owner: elena@phase.com / password123");
  console.log(`  Boarding House: ${house.name}`);
  console.log(`  Rooms: ${roomsData.length}`);
  console.log(`  Tenants: ${tenantsData.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
