import { prisma } from "@/lib/prisma";

export async function getTestDb() {
  return prisma;
}

/**
 * Wipes all data from the public schema using TRUNCATE CASCADE.
 *
 * Tests run against an embedded Postgres started by vitest.globalSetup.ts,
 * so the connection always points at the local test database. CASCADE
 * handles foreign keys automatically — no need to delete in dependency order.
 */
const TABLES = [
  "ReminderLog",
  "ReminderConfig",
  "Deposit",
  "Contract",
  "AnnouncementRead",
  "Announcement",
  "AuditLog",
  "SupportTicket",
  "Notification",
  "RoomTransfer",
  "Bill",
  "Invoice",
  "Tenant",
  "Room",
  "BoardingHouse",
  "Subscription",
  "User",
  "RateLimit",
];

export async function cleanupTestDb() {
  const qualified = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE`);
}

export async function disconnectTestDb() {
  await prisma.$disconnect();
}
