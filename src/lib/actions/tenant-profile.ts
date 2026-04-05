import { prisma } from "@/lib/prisma";

export async function getTenantProfile(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      room: { select: { id: true, number: true, floor: true, monthlyRate: true } },
      boardingHouse: { select: { id: true, name: true } },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          type: true,
          status: true,
          dueDate: true,
          paidDate: true,
          sentVia: true,
          sentAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      transfers: {
        select: {
          id: true,
          status: true,
          reason: true,
          transferDate: true,
          createdAt: true,
          fromRoom: { select: { number: true, floor: true } },
          toRoom: { select: { number: true, floor: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant) return null;

  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    emergencyContact: tenant.emergencyContact,
    emergencyPhone: tenant.emergencyPhone,
    tag: tenant.tag,
    photoUrl: tenant.photoUrl,
    status: tenant.status,
    moveInDate: tenant.moveInDate,
    moveOutDate: tenant.moveOutDate,
    room: tenant.room,
    boardingHouse: tenant.boardingHouse,
    invoices: tenant.invoices,
    transfers: tenant.transfers,
    totalPaid: tenant.invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.amount, 0),
    totalPending: tenant.invoices
      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((sum, i) => sum + i.amount, 0),
  };
}
