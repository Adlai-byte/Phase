import { describe, it, expect, vi } from "vitest";
import { buildInvoiceSmsMessage, validatePhoneNumber, normalizePhoneNumber, sendInvoiceSms, type SmsProvider } from "./sms";

describe("SMS Service", () => {
  const invoiceData = {
    invoiceNumber: "PH-2604-A1B2",
    tenantName: "Maria Santos",
    boardingHouseName: "Casa Marina Residences",
    roomNumber: "204",
    amount: 3500,
    type: "RENT" as const,
    dueDate: new Date("2026-05-05"),
  };

  describe("validatePhoneNumber", () => {
    it("accepts PH mobile format 09XX-XXX-XXXX", () => {
      expect(validatePhoneNumber("0917-123-4567")).toBe(true);
    });

    it("accepts format without dashes", () => {
      expect(validatePhoneNumber("09171234567")).toBe(true);
    });

    it("accepts +63 format", () => {
      expect(validatePhoneNumber("+639171234567")).toBe(true);
    });

    it("rejects empty string", () => {
      expect(validatePhoneNumber("")).toBe(false);
    });

    it("rejects too-short numbers", () => {
      expect(validatePhoneNumber("0917123")).toBe(false);
    });

    it("rejects null/undefined", () => {
      expect(validatePhoneNumber(null as any)).toBe(false);
      expect(validatePhoneNumber(undefined as any)).toBe(false);
    });
  });

  describe("normalizePhoneNumber", () => {
    it("converts 09XX to +639XX format", () => {
      expect(normalizePhoneNumber("09171234567")).toBe("+639171234567");
    });

    it("strips dashes", () => {
      expect(normalizePhoneNumber("0917-123-4567")).toBe("+639171234567");
    });

    it("keeps +63 format as-is", () => {
      expect(normalizePhoneNumber("+639171234567")).toBe("+639171234567");
    });
  });

  describe("buildInvoiceSmsMessage", () => {
    it("includes invoice number", () => {
      const msg = buildInvoiceSmsMessage(invoiceData);
      expect(msg).toContain("PH-2604-A1B2");
    });

    it("includes amount with peso sign", () => {
      const msg = buildInvoiceSmsMessage(invoiceData);
      expect(msg).toContain("P3,500");
    });

    it("includes due date", () => {
      const msg = buildInvoiceSmsMessage(invoiceData);
      expect(msg).toContain("May");
    });

    it("includes boarding house name", () => {
      const msg = buildInvoiceSmsMessage(invoiceData);
      expect(msg).toContain("Casa Marina");
    });

    it("stays under 320 characters for SMS", () => {
      const msg = buildInvoiceSmsMessage(invoiceData);
      expect(msg.length).toBeLessThanOrEqual(320);
    });

    it("includes Phase branding", () => {
      const msg = buildInvoiceSmsMessage(invoiceData);
      expect(msg).toContain("Phase");
    });
  });

  describe("sendInvoiceSms", () => {
    const mockProvider: SmsProvider = {
      send: vi.fn().mockResolvedValue({ success: true }),
    };

    it("sends SMS via provider with normalized phone", async () => {
      const result = await sendInvoiceSms("0917-123-4567", invoiceData, mockProvider);
      expect(result.success).toBe(true);
      expect(mockProvider.send).toHaveBeenCalledWith(
        "+639171234567",
        expect.stringContaining("PH-2604-A1B2")
      );
    });

    it("rejects invalid phone number", async () => {
      const result = await sendInvoiceSms("invalid", invoiceData, mockProvider);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid phone");
    });

    it("rejects empty phone number", async () => {
      const result = await sendInvoiceSms("", invoiceData, mockProvider);
      expect(result.success).toBe(false);
    });

    it("propagates provider errors", async () => {
      const failProvider: SmsProvider = {
        send: vi.fn().mockResolvedValue({ success: false, error: "API key invalid" }),
      };
      const result = await sendInvoiceSms("09171234567", invoiceData, failProvider);
      expect(result.success).toBe(false);
      expect(result.error).toBe("API key invalid");
    });

    it("handles provider exceptions", async () => {
      const throwProvider: SmsProvider = {
        send: vi.fn().mockRejectedValue(new Error("Network error")),
      };
      // sendInvoiceSms calls provider.send which throws - the error propagates
      // since sendInvoiceSms doesn't catch provider exceptions
      await expect(sendInvoiceSms("09171234567", invoiceData, throwProvider)).rejects.toThrow("Network error");
    });
  });
});
