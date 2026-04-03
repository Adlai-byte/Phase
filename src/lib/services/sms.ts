import { formatDate } from "@/lib/utils";

export type InvoiceSmsData = {
  invoiceNumber: string;
  tenantName: string;
  boardingHouseName: string;
  roomNumber: string;
  amount: number;
  type: "RENT" | "ELECTRICITY" | "WATER" | "OTHER";
  dueDate: Date;
};

export function validatePhoneNumber(phone: any): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[-\s]/g, "");
  // PH mobile: 09XXXXXXXXX or +639XXXXXXXXX
  return /^(\+63|0)9\d{9}$/.test(cleaned);
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[-\s]/g, "");
  if (cleaned.startsWith("0")) {
    return "+63" + cleaned.slice(1);
  }
  return cleaned;
}

export function buildInvoiceSmsMessage(data: InvoiceSmsData): string {
  const amount = `P${data.amount.toLocaleString()}`;
  const date = formatDate(data.dueDate);
  const house = data.boardingHouseName.length > 20
    ? data.boardingHouseName.slice(0, 20)
    : data.boardingHouseName;

  return `[Phase] Hi ${data.tenantName}, your ${data.type} invoice ${data.invoiceNumber} for ${amount} at ${house} Rm${data.roomNumber} is due ${date}. Pls settle on or before the due date. Thank you!`;
}

// Semaphore API (Philippine SMS gateway) - abstract for testing
export type SmsProvider = {
  send(to: string, message: string): Promise<{ success: boolean; error?: string }>;
};

function getSemaphoreProvider(): SmsProvider {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER || "Phase";

  return {
    async send(to: string, message: string) {
      if (!apiKey) {
        return { success: false, error: "SMS API key not configured" };
      }

      try {
        const res = await fetch("https://api.semaphore.co/api/v4/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apikey: apiKey,
            number: to,
            message,
            sendername: senderName,
          }),
        });

        if (!res.ok) {
          return { success: false, error: `SMS API error: ${res.status}` };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
  };
}

export async function sendInvoiceSms(
  phone: string,
  data: InvoiceSmsData,
  provider?: SmsProvider
): Promise<{ success: boolean; error?: string }> {
  if (!validatePhoneNumber(phone)) {
    return { success: false, error: "Invalid phone number" };
  }

  const normalized = normalizePhoneNumber(phone);
  const message = buildInvoiceSmsMessage(data);
  const smsProvider = provider || getSemaphoreProvider();

  return smsProvider.send(normalized, message);
}
