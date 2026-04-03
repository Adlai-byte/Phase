import { prisma } from "@/lib/prisma";

export async function getTestDb() {
  return prisma;
}

export async function cleanupTestDb() {
  const tables = [
    "Notification",
    "RoomTransfer",
    "Bill",
    "Invoice",
    "Tenant",
    "Room",
    "BoardingHouse",
    "Subscription",
    "User",
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
}

export async function disconnectTestDb() {
  await prisma.$disconnect();
}
