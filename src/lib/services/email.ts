import nodemailer from "nodemailer";
import { formatCurrency, formatDate } from "@/lib/utils";

export type InvoiceEmailData = {
  invoiceNumber: string;
  tenantName: string;
  boardingHouseName: string;
  roomNumber: string;
  amount: number;
  type: "RENT" | "ELECTRICITY" | "WATER" | "OTHER";
  dueDate: Date;
  description?: string;
};

export function validateEmailRecipient(email: any): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function buildInvoiceEmailHtml(data: InvoiceEmailData): string {
  const formattedAmount = formatCurrency(data.amount);
  const formattedDate = formatDate(data.dueDate);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f9fc;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#004d64,#006684);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:Manrope,Arial,sans-serif;">Phase</h1>
      <p style="color:#a2e1ff;margin:8px 0 0;font-size:14px;">Invoice Notification</p>
    </div>
    <div style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;">
      <p style="color:#181c1e;font-size:16px;margin:0 0 24px;">Hello <strong>${data.tenantName}</strong>,</p>
      <p style="color:#3f484d;font-size:14px;line-height:1.6;margin:0 0 24px;">
        You have a new invoice from <strong>${data.boardingHouseName}</strong>.
      </p>
      <div style="background:#f2f4f6;border-radius:12px;padding:24px;margin:0 0 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#3f484d;font-size:13px;padding:8px 0;">Invoice #</td>
            <td style="color:#181c1e;font-size:13px;font-weight:600;text-align:right;padding:8px 0;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color:#3f484d;font-size:13px;padding:8px 0;">Room</td>
            <td style="color:#181c1e;font-size:13px;font-weight:600;text-align:right;padding:8px 0;">${data.roomNumber}</td>
          </tr>
          <tr>
            <td style="color:#3f484d;font-size:13px;padding:8px 0;">Type</td>
            <td style="color:#181c1e;font-size:13px;font-weight:600;text-align:right;padding:8px 0;">${data.type}</td>
          </tr>
          <tr>
            <td style="color:#3f484d;font-size:13px;padding:8px 0;">Due Date</td>
            <td style="color:#181c1e;font-size:13px;font-weight:600;text-align:right;padding:8px 0;">${formattedDate}</td>
          </tr>
          ${data.description ? `<tr><td style="color:#3f484d;font-size:13px;padding:8px 0;">Description</td><td style="color:#181c1e;font-size:13px;text-align:right;padding:8px 0;">${data.description}</td></tr>` : ""}
        </table>
        <div style="border-top:1px solid #e0e3e5;margin:16px 0;"></div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#004d64;font-size:16px;font-weight:700;padding:8px 0;">Amount Due</td>
            <td style="color:#004d64;font-size:20px;font-weight:700;text-align:right;padding:8px 0;">${formattedAmount}</td>
          </tr>
        </table>
      </div>
      <p style="color:#3f484d;font-size:13px;line-height:1.6;margin:0 0 8px;">
        Please settle this invoice on or before the due date. Contact your boarding house owner for payment options.
      </p>
      <p style="color:#70787e;font-size:12px;margin:24px 0 0;text-align:center;">
        Sent via Phase — Boarding House Management Platform
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function buildInvoiceEmailText(data: InvoiceEmailData): string {
  const formattedAmount = formatCurrency(data.amount);
  const formattedDate = formatDate(data.dueDate);

  return `Phase - Invoice Notification

Hello ${data.tenantName},

You have a new invoice from ${data.boardingHouseName}.

Invoice #: ${data.invoiceNumber}
Room: ${data.roomNumber}
Type: ${data.type}
Amount Due: ${formattedAmount}
Due Date: ${formattedDate}
${data.description ? `Description: ${data.description}` : ""}

Please settle this invoice on or before the due date.

— Phase, Boarding House Management Platform`;
}

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendInvoiceEmail(
  to: string,
  data: InvoiceEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!validateEmailRecipient(to)) {
    return { success: false, error: "Invalid recipient email" };
  }

  try {
    const transport = getTransport();
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || '"Phase" <noreply@phase.app>',
      to,
      subject: `Invoice ${data.invoiceNumber} — ${formatCurrency(data.amount)} due ${formatDate(data.dueDate)}`,
      text: buildInvoiceEmailText(data),
      html: buildInvoiceEmailHtml(data),
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
