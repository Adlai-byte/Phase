import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

const createInvoiceSchema = z.object({
  tenantId: z.string(),
  boardingHouseId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["RENT", "ELECTRICITY", "WATER", "OTHER"]),
  dueDate: z.date(),
  description: z.string().optional(),
  sentVia: z.enum(["EMAIL", "SMS", "BOTH"]).optional(),
});

export async function createInvoice(input: z.infer<typeof createInvoiceSchema>) {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const invoice = await prisma.invoice.create({
    data: {
      ...parsed.data,
      invoiceNumber: generateInvoiceNumber(),
      status: "PENDING",
    },
  });

  return { success: true as const, invoice };
}

export async function getInvoices(
  boardingHouseId: string,
  filters?: { status?: string; type?: string }
) {
  const where: Record<string, unknown> = { boardingHouseId };
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;

  return prisma.invoice.findMany({
    where,
    include: {
      tenant: {
        include: { room: { select: { number: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markInvoicePaid(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    return { success: false as const, error: "Invoice not found" };
  }
  if (invoice.status === "PAID") {
    return { success: false as const, error: "Invoice is already paid" };
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidDate: new Date() },
  });

  return { success: true as const, invoice: updated };
}

export function calculateElectricityBill(input: {
  currentReading: number;
  previousReading: number;
  ratePerUnit: number;
}) {
  const consumption = input.currentReading - input.previousReading;
  return Math.max(0, consumption * input.ratePerUnit);
}

export async function generateMonthlyInvoices(boardingHouseId: string, period: string) {
  const tenants = await prisma.tenant.findMany({
    where: { boardingHouseId, status: "ACTIVE", roomId: { not: null } },
    include: { room: true },
  });

  const [year, month] = period.split("-").map(Number);
  const dueDate = new Date(year, month - 1, 5); // Due on 5th of the month

  let count = 0;
  for (const tenant of tenants) {
    if (!tenant.room) continue;

    await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        amount: tenant.room.monthlyRate,
        type: "RENT",
        status: "PENDING",
        dueDate,
        description: `Rent for ${period}`,
        tenantId: tenant.id,
        boardingHouseId,
      },
    });
    count++;
  }

  return { success: true as const, count };
}
