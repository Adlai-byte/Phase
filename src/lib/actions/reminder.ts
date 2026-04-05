import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/services/reminder-templates";
import { formatCurrency, formatDate } from "@/lib/utils";

type ReminderConfigInput = {
  boardingHouseId: string;
  name: string;
  triggerType: string;
  triggerDays: number;
  channel: string;
  templateSubject?: string;
  templateBody: string;
};

export async function createReminderConfig(input: ReminderConfigInput) {
  return prisma.reminderConfig.create({
    data: {
      name: input.name,
      triggerType: input.triggerType,
      triggerDays: input.triggerDays,
      channel: input.channel,
      templateSubject: input.templateSubject || null,
      templateBody: input.templateBody,
      enabled: true,
      boardingHouseId: input.boardingHouseId,
    },
  });
}

export async function getReminderConfigs(boardingHouseId: string) {
  return prisma.reminderConfig.findMany({
    where: { boardingHouseId },
    orderBy: { createdAt: "desc" },
  });
}

export async function processReminders(
  boardingHouseId: string,
  options?: { dryRun?: boolean }
) {
  const configs = await prisma.reminderConfig.findMany({
    where: { boardingHouseId, enabled: true },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      boardingHouseId,
      status: { in: ["PENDING", "OVERDUE"] },
    },
    include: {
      tenant: { select: { name: true, email: true, phone: true } },
      boardingHouse: { select: { name: true } },
    },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let sent = 0;
  let skipped = 0;

  for (const invoice of invoices) {
    const dueDate = new Date(invoice.dueDate);
    const dueDateNorm = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffMs = dueDateNorm.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    for (const config of configs) {
      let shouldSend = false;

      if (config.triggerType === "BEFORE_DUE" && diffDays === config.triggerDays) {
        shouldSend = true;
      } else if (config.triggerType === "AFTER_DUE" && diffDays === -config.triggerDays) {
        shouldSend = true;
      }

      if (!shouldSend) continue;

      // Check if already sent today for this invoice+config
      const alreadySent = await prisma.reminderLog.findFirst({
        where: {
          invoiceId: invoice.id,
          reminderConfigId: config.id,
          sentAt: { gte: today },
        },
      });
      if (alreadySent) {
        skipped++;
        continue;
      }

      const vars = {
        tenantName: invoice.tenant.name,
        amount: formatCurrency(invoice.amount),
        dueDate: formatDate(invoice.dueDate),
        invoiceNumber: invoice.invoiceNumber,
        boardingHouseName: invoice.boardingHouse.name,
        type: invoice.type,
        days: Math.abs(diffDays).toString(),
      };

      const message = renderTemplate(config.templateBody, vars);

      if (!options?.dryRun) {
        // Real send via email/SMS services would go here
        // For now, just log
      }

      // Log the send
      await prisma.reminderLog.create({
        data: {
          status: "SENT",
          channel: config.channel,
          invoiceId: invoice.id,
          reminderConfigId: config.id,
        },
      });

      sent++;
    }
  }

  return { sent, skipped };
}

export async function getOverdueTenants(boardingHouseId: string) {
  const now = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      boardingHouseId,
      status: { in: ["PENDING", "OVERDUE"] },
      dueDate: { lt: now },
    },
    include: {
      tenant: { select: { id: true, name: true, email: true, phone: true, room: { select: { number: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  return overdueInvoices.map((inv) => {
    const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      invoice: inv,
      tenant: inv.tenant,
      daysOverdue,
      amount: inv.amount,
    };
  });
}
