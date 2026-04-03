import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail, validateEmailRecipient, type InvoiceEmailData } from "./email";
import { sendInvoiceSms, validatePhoneNumber, type InvoiceSmsData } from "./sms";

type NotificationChannel = "EMAIL" | "SMS" | "BOTH";

type NotificationResult = {
  success: boolean;
  channels?: string[];
  error?: string;
};

export async function prepareInvoiceNotificationData(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: {
        include: { room: { select: { number: true } } },
      },
      boardingHouse: { select: { name: true } },
    },
  });

  if (!invoice) return null;

  return {
    invoiceNumber: invoice.invoiceNumber,
    tenantName: invoice.tenant.name,
    tenantEmail: invoice.tenant.email,
    tenantPhone: invoice.tenant.phone,
    boardingHouseName: invoice.boardingHouse.name,
    roomNumber: invoice.tenant.room?.number || "N/A",
    amount: invoice.amount,
    type: invoice.type as "RENT" | "ELECTRICITY" | "WATER" | "OTHER",
    dueDate: invoice.dueDate,
    description: invoice.description,
  };
}

export async function sendInvoiceNotification(
  invoiceId: string,
  channel: NotificationChannel,
  options?: { dryRun?: boolean }
): Promise<NotificationResult> {
  const data = await prepareInvoiceNotificationData(invoiceId);
  if (!data) return { success: false, error: "Invoice not found" };

  const sentChannels: string[] = [];
  const errors: string[] = [];

  const emailData: InvoiceEmailData = {
    invoiceNumber: data.invoiceNumber,
    tenantName: data.tenantName,
    boardingHouseName: data.boardingHouseName,
    roomNumber: data.roomNumber,
    amount: data.amount,
    type: data.type,
    dueDate: data.dueDate,
    description: data.description || undefined,
  };

  // Send EMAIL
  if (channel === "EMAIL" || channel === "BOTH") {
    if (!data.tenantEmail || !validateEmailRecipient(data.tenantEmail)) {
      if (channel === "EMAIL") {
        return { success: false, error: "Tenant has no email address" };
      }
      errors.push("Skipped email: no email address");
    } else {
      if (!options?.dryRun) {
        const result = await sendInvoiceEmail(data.tenantEmail, emailData);
        if (!result.success) errors.push(`Email failed: ${result.error}`);
        else sentChannels.push("EMAIL");
      } else {
        sentChannels.push("EMAIL");
      }
    }
  }

  // Send SMS
  if (channel === "SMS" || channel === "BOTH") {
    if (!validatePhoneNumber(data.tenantPhone)) {
      if (channel === "SMS") {
        return { success: false, error: "Tenant has no valid phone number" };
      }
      errors.push("Skipped SMS: invalid phone");
    } else {
      const smsData: InvoiceSmsData = {
        invoiceNumber: data.invoiceNumber,
        tenantName: data.tenantName,
        boardingHouseName: data.boardingHouseName,
        roomNumber: data.roomNumber,
        amount: data.amount,
        type: data.type,
        dueDate: data.dueDate,
      };

      if (!options?.dryRun) {
        const result = await sendInvoiceSms(data.tenantPhone, smsData);
        if (!result.success) errors.push(`SMS failed: ${result.error}`);
        else sentChannels.push("SMS");
      } else {
        sentChannels.push("SMS");
      }
    }
  }

  if (sentChannels.length === 0) {
    return { success: false, error: errors.join("; ") || "No channels sent" };
  }

  // Update invoice record
  const sentVia = sentChannels.length === 2 ? "BOTH" : sentChannels[0];
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { sentVia, sentAt: new Date() },
  });

  return { success: true, channels: sentChannels };
}
