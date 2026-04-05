import { prisma } from "@/lib/prisma";

function csvField(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || /^[=+\-@\t\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportInvoicesCSV(boardingHouseId: string): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { boardingHouseId },
    include: { tenant: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = "Invoice #,Tenant,Type,Amount,Due Date,Status,Paid Date,Sent Via";
  const rows = invoices.map((i) =>
    [
      csvField(i.invoiceNumber),
      csvField(i.tenant.name),
      csvField(i.type),
      csvField(i.amount),
      csvField(i.dueDate.toISOString().split("T")[0]),
      csvField(i.status),
      csvField(i.paidDate ? i.paidDate.toISOString().split("T")[0] : ""),
      csvField(i.sentVia || ""),
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
      csvField(t.name),
      csvField(t.email || ""),
      csvField(t.phone),
      csvField(t.room ? `Room ${t.room.number}` : "Unassigned"),
      csvField(t.status),
      csvField(t.moveInDate.toISOString().split("T")[0]),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
