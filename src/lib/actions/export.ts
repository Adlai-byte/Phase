import { prisma } from "@/lib/prisma";

export async function exportInvoicesCSV(boardingHouseId: string): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { boardingHouseId },
    include: { tenant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = "Invoice #,Tenant,Type,Amount,Due Date,Status,Paid Date,Sent Via";
  const rows = invoices.map((i) =>
    [
      i.invoiceNumber,
      i.tenant.name,
      i.type,
      i.amount,
      i.dueDate.toISOString().split("T")[0],
      i.status,
      i.paidDate ? i.paidDate.toISOString().split("T")[0] : "",
      i.sentVia || "",
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

export async function exportTenantsCSV(boardingHouseId: string): Promise<string> {
  const tenants = await prisma.tenant.findMany({
    where: { boardingHouseId },
    include: { room: { select: { number: true } } },
    orderBy: { name: "asc" },
  });

  const header = "Name,Email,Phone,Room,Status,Move-In Date";
  const rows = tenants.map((t) =>
    [
      t.name,
      t.email || "",
      t.phone,
      t.room ? `Room ${t.room.number}` : "Unassigned",
      t.status,
      t.moveInDate.toISOString().split("T")[0],
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
