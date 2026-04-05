"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses, getBoardingHouseById, createBoardingHouse as createBoardingHouseAction } from "@/lib/actions/boarding-house";
import { getRooms, createRoom as createRoomAction, updateRoomStatus as updateRoomStatusAction } from "@/lib/actions/room";
import { getTenants, createTenant as createTenantAction, updateTenant as updateTenantAction } from "@/lib/actions/tenant";
import { getInvoices, createInvoice as createInvoiceAction, markInvoicePaid as markPaidAction, generateMonthlyInvoices as genInvoicesAction } from "@/lib/actions/invoice";
import { createTransfer as createTransferAction, getTransferHistory } from "@/lib/actions/transfer";
import { canCreateRoom, canCreateTenant, canSendNotification } from "@/lib/actions/subscription";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notification";
import { formatCurrency } from "@/lib/utils";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") redirect("/login");
  return user;
}

/** Verify that a boarding house belongs to the authenticated user */
async function verifyOwnership(userId: string, boardingHouseId: string) {
  const house = await prisma.boardingHouse.findUnique({
    where: { id: boardingHouseId },
    select: { ownerId: true },
  });
  if (!house || house.ownerId !== userId) {
    return { allowed: false, error: "You do not have permission to access this property" };
  }
  return { allowed: true };
}

/** Verify that an entity (room, invoice, tenant) belongs to one of the user's houses */
async function verifyEntityOwnership(userId: string, entityBoardingHouseId: string) {
  return verifyOwnership(userId, entityBoardingHouseId);
}

// ── Dashboard Data ──────────────────────────────────────────

export async function getDashboardData() {
  const user = await requireOwner();
  const houses = await getOwnerBoardingHouses(user.id);

  if (houses.length === 0) {
    return { user, houses: [], stats: null, recentInvoices: [] };
  }

  const houseIds = houses.map((h) => h.id);

  const [tenantCount, invoices] = await Promise.all([
    prisma.tenant.count({ where: { boardingHouseId: { in: houseIds }, status: "ACTIVE" } }),
    prisma.invoice.findMany({
      where: { boardingHouseId: { in: houseIds } },
      include: { tenant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalRooms = houses.reduce((s, h) => s + h.totalRooms, 0);
  const occupiedRooms = houses.reduce((s, h) => s + h.occupiedRooms, 0);
  const paidThisMonth = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.amount, 0);
  const pendingCount = invoices.filter((i) => i.status === "PENDING").length;

  return {
    user,
    houses,
    stats: {
      totalTenants: tenantCount,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      monthlyRevenue: paidThisMonth,
      pendingInvoices: pendingCount,
      totalRooms,
      occupiedRooms,
    },
    recentInvoices: invoices,
  };
}

// ── Property Data ──────────────────────────────────────────

export async function getPropertyData() {
  const user = await requireOwner();
  const houses = await getOwnerBoardingHouses(user.id);
  return { user, houses };
}

export async function getPropertyDetailData(propertyId: string) {
  const user = await requireOwner();
  const house = await getBoardingHouseById(propertyId);
  if (!house || house.ownerId !== user.id) return null;
  const rooms = await getRooms(propertyId);
  return { user, house, rooms };
}

// ── Tenant Data ──────────────────────────────────────────

export async function getTenantData(boardingHouseId?: string) {
  const user = await requireOwner();
  const houses = await getOwnerBoardingHouses(user.id);
  const houseId = boardingHouseId || houses[0]?.id;
  if (!houseId) return { user, houses, tenants: [] };
  const tenants = await getTenants(houseId);
  return { user, houses, tenants };
}

// ── Invoice Data ──────────────────────────────────────────

export async function getInvoiceData(boardingHouseId?: string) {
  const user = await requireOwner();
  const houses = await getOwnerBoardingHouses(user.id);
  const houseId = boardingHouseId || houses[0]?.id;
  if (!houseId) return { user, houses, invoices: [] };
  const invoices = await getInvoices(houseId);
  return { user, houses, invoices };
}

// ── Boarding House CRUD ──────────────────────────────────────

export async function addBoardingHouse(formData: FormData) {
  const user = await requireOwner();

  const amenitiesRaw = formData.get("amenities") as string;
  const restrictionsRaw = formData.get("restrictions") as string;

  const result = await createBoardingHouseAction({
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    type: formData.get("type") as "ALL_FEMALE" | "ALL_MALE" | "MIXED",
    description: (formData.get("description") as string) || undefined,
    amenities: amenitiesRaw ? amenitiesRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    restrictions: restrictionsRaw ? restrictionsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    hasCurfew: formData.get("hasCurfew") === "on",
    curfewTime: (formData.get("curfewTime") as string) || undefined,
    contactPhone: (formData.get("contactPhone") as string) || undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
    ownerId: user.id,
  });

  if (result.success) {
    await createNotification({
      userId: user.id,
      title: "Property Created",
      message: `${formData.get("name")} has been added. It will be visible after admin verification.`,
      type: "INFO",
      link: "/dashboard/properties",
    });
    revalidatePath("/dashboard/properties");
  }
  return result;
}

// ── Transfer Data ──────────────────────────────────────────

export async function getTransferData(boardingHouseId?: string) {
  const user = await requireOwner();
  const houses = await getOwnerBoardingHouses(user.id);
  const houseId = boardingHouseId || houses[0]?.id;
  if (!houseId) return { user, houses, history: [], rooms: [], tenants: [] };

  const [history, rooms, tenants] = await Promise.all([
    getTransferHistory(houseId),
    getRooms(houseId),
    getTenants(houseId, { status: "ACTIVE" }),
  ]);

  return { user, houses, history, rooms, tenants };
}

// ── Mutations (all with ownership verification) ──────────────

export async function addRoom(formData: FormData) {
  const user = await requireOwner();
  const boardingHouseId = formData.get("boardingHouseId") as string;

  const ownership = await verifyOwnership(user.id, boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const limitCheck = await canCreateRoom(user.id);
  if (!limitCheck.allowed) return { success: false, error: limitCheck.reason };

  const result = await createRoomAction({
    number: formData.get("number") as string,
    floor: Number(formData.get("floor") || 1),
    capacity: Number(formData.get("capacity") || 1),
    monthlyRate: Number(formData.get("monthlyRate")),
    roomType: (formData.get("roomType") as string) || "BEDSPACER",
    hasAircon: formData.get("hasAircon") === "on",
    hasWifi: formData.get("hasWifi") === "on",
    hasBathroom: formData.get("hasBathroom") === "on",
    electricityIncluded: formData.get("electricityIncluded") === "on",
    boardingHouseId,
  });

  if (result.success) revalidatePath("/dashboard/properties");
  return result;
}

export async function addTenant(formData: FormData) {
  const user = await requireOwner();
  const boardingHouseId = formData.get("boardingHouseId") as string;
  const name = formData.get("name") as string;

  const ownership = await verifyOwnership(user.id, boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const limitCheck = await canCreateTenant(user.id);
  if (!limitCheck.allowed) return { success: false, error: limitCheck.reason };

  const result = await createTenantAction({
    name,
    phone: formData.get("phone") as string,
    email: (formData.get("email") as string) || undefined,
    emergencyContact: (formData.get("emergencyContact") as string) || undefined,
    emergencyPhone: (formData.get("emergencyPhone") as string) || undefined,
    tag: (formData.get("tag") as string) || undefined,
    boardingHouseId,
    roomId: (formData.get("roomId") as string) || undefined,
  });

  if (result.success) {
    await createNotification({
      userId: user.id,
      title: "New Tenant Added",
      message: `${name} has been added to your property`,
      type: "TENANT",
      link: "/dashboard/tenants",
    });
    revalidatePath("/dashboard/tenants");
  }
  return result;
}

export async function editTenant(formData: FormData) {
  const user = await requireOwner();
  const tenantId = formData.get("id") as string;

  // Verify tenant belongs to owner's house
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { boardingHouseId: true } });
  if (!tenant) return { success: false, error: "Tenant not found" };
  const ownership = await verifyOwnership(user.id, tenant.boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const result = await updateTenantAction({
    id: tenantId,
    name: (formData.get("name") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    emergencyContact: (formData.get("emergencyContact") as string) || undefined,
    emergencyPhone: (formData.get("emergencyPhone") as string) || undefined,
    tag: (formData.get("tag") as string) || undefined,
    status: (formData.get("status") as "ACTIVE" | "INACTIVE" | "PENDING") || undefined,
  });

  if (result.success) revalidatePath("/dashboard/tenants");
  return result;
}

export async function addInvoice(formData: FormData) {
  const user = await requireOwner();
  const boardingHouseId = formData.get("boardingHouseId") as string;

  const ownership = await verifyOwnership(user.id, boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const result = await createInvoiceAction({
    tenantId: formData.get("tenantId") as string,
    boardingHouseId,
    amount: Number(formData.get("amount")),
    type: formData.get("type") as "RENT" | "ELECTRICITY" | "WATER" | "OTHER",
    dueDate: new Date(formData.get("dueDate") as string),
    description: (formData.get("description") as string) || undefined,
  });

  if (result.success) revalidatePath("/dashboard/invoices");
  return result;
}

export async function payInvoice(invoiceId: string) {
  const user = await requireOwner();

  // Verify the invoice belongs to one of the user's properties
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { boardingHouseId: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found" };

  const ownership = await verifyOwnership(user.id, invoice.boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const result = await markPaidAction(invoiceId);
  if (result.success) {
    await createNotification({
      userId: user.id,
      title: "Payment Recorded",
      message: `Invoice ${result.invoice!.invoiceNumber} marked as paid — ${formatCurrency(result.invoice!.amount)}`,
      type: "PAYMENT",
      link: "/dashboard/invoices",
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/billing");
  }
  return result;
}

export async function changeRoomStatus(roomId: string, status: string) {
  const user = await requireOwner();

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { boardingHouseId: true },
  });
  if (!room) return { success: false, error: "Room not found" };

  const ownership = await verifyOwnership(user.id, room.boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const result = await updateRoomStatusAction(roomId, status);
  if (result.success) revalidatePath("/dashboard/properties");
  return result;
}

export async function submitTransfer(formData: FormData) {
  const user = await requireOwner();
  const fromRoomId = formData.get("fromRoomId") as string;

  // Verify via the fromRoom's boarding house
  const room = await prisma.room.findUnique({
    where: { id: fromRoomId },
    select: { boardingHouseId: true },
  });
  if (!room) return { success: false, error: "Room not found" };

  const ownership = await verifyOwnership(user.id, room.boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const result = await createTransferAction({
    tenantId: formData.get("tenantId") as string,
    fromRoomId,
    toRoomId: formData.get("toRoomId") as string,
    reason: (formData.get("reason") as string) || undefined,
  });

  if (result.success) revalidatePath("/dashboard/transfers");
  return result;
}

export async function generateInvoices(boardingHouseId: string, period: string) {
  const user = await requireOwner();

  const ownership = await verifyOwnership(user.id, boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  const result = await genInvoicesAction(boardingHouseId, period);
  if (result.success) revalidatePath("/dashboard/invoices");
  return result;
}

export async function sendInvoice(invoiceId: string, channel: "EMAIL" | "SMS" | "BOTH") {
  const user = await requireOwner();

  // Verify invoice ownership
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { boardingHouseId: true },
  });
  if (!invoice) return { success: false, error: "Invoice not found" };

  const ownership = await verifyOwnership(user.id, invoice.boardingHouseId);
  if (!ownership.allowed) return { success: false, error: ownership.error };

  // Check subscription allows notifications
  const notifCheck = await canSendNotification(user.id);
  if (!notifCheck.allowed) return { success: false, error: notifCheck.reason };

  const { sendInvoiceNotification } = await import("@/lib/services/notification");
  const result = await sendInvoiceNotification(invoiceId, channel);
  if (result.success) revalidatePath("/dashboard/invoices");
  return result;
}
