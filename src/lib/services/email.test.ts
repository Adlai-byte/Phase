import { describe, it, expect, vi } from "vitest";
import { buildInvoiceEmailHtml, buildInvoiceEmailText, validateEmailRecipient, sendInvoiceEmail, type EmailTransport } from "./email";

describe("Email Service", () => {
  const invoiceData = {
    invoiceNumber: "PH-2604-A1B2",
    tenantName: "Maria Santos",
    boardingHouseName: "Casa Marina Residences",
    roomNumber: "204",
    amount: 3500,
    type: "RENT" as const,
    dueDate: new Date("2026-05-05"),
    description: "Rent for May 2026",
  };

  describe("validateEmailRecipient", () => {
    it("accepts valid email", () => {
      expect(validateEmailRecipient("maria@email.com")).toBe(true);
    });

    it("rejects empty string", () => {
      expect(validateEmailRecipient("")).toBe(false);
    });

    it("rejects invalid format", () => {
      expect(validateEmailRecipient("not-an-email")).toBe(false);
    });

    it("rejects null/undefined", () => {
      expect(validateEmailRecipient(null as any)).toBe(false);
      expect(validateEmailRecipient(undefined as any)).toBe(false);
    });
  });

  describe("buildInvoiceEmailHtml", () => {
    it("includes invoice number in HTML", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("PH-2604-A1B2");
    });

    it("includes tenant name", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("Maria Santos");
    });

    it("includes formatted amount with peso sign", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("3,500");
      expect(html).toContain("₱");
    });

    it("includes due date", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("May");
      expect(html).toContain("2026");
    });

    it("includes boarding house name", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("Casa Marina Residences");
    });

    it("includes room number", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("204");
    });

    it("uses Phase branding colors", () => {
      const html = buildInvoiceEmailHtml(invoiceData);
      expect(html).toContain("#004d64");
    });
  });

  describe("buildInvoiceEmailText", () => {
    it("includes all key invoice details as plain text", () => {
      const text = buildInvoiceEmailText(invoiceData);
      expect(text).toContain("PH-2604-A1B2");
      expect(text).toContain("Maria Santos");
      expect(text).toContain("3,500");
      expect(text).toContain("Casa Marina");
    });
  });

  describe("sendInvoiceEmail", () => {
    const mockTransport: EmailTransport = {
      sendMail: vi.fn().mockResolvedValue({ messageId: "mock-msg-123" }),
    };

    it("sends email via transport and returns messageId", async () => {
      const result = await sendInvoiceEmail("maria@email.com", invoiceData, mockTransport);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("mock-msg-123");
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "maria@email.com",
          subject: expect.stringContaining("PH-2604-A1B2"),
        })
      );
    });

    it("includes HTML and text versions", async () => {
      await sendInvoiceEmail("maria@email.com", invoiceData, mockTransport);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("#004d64"),
          text: expect.stringContaining("Maria Santos"),
        })
      );
    });

    it("rejects invalid email recipient", async () => {
      const result = await sendInvoiceEmail("not-valid", invoiceData, mockTransport);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("rejects empty email recipient", async () => {
      const result = await sendInvoiceEmail("", invoiceData, mockTransport);
      expect(result.success).toBe(false);
    });

    it("handles transport errors gracefully", async () => {
      const failTransport: EmailTransport = {
        sendMail: vi.fn().mockRejectedValue(new Error("SMTP connection refused")),
      };
      const result = await sendInvoiceEmail("maria@email.com", invoiceData, failTransport);
      expect(result.success).toBe(false);
      expect(result.error).toBe("SMTP connection refused");
    });

    it("includes formatted subject line with amount and due date", async () => {
      await sendInvoiceEmail("maria@email.com", invoiceData, mockTransport);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("3,500"),
        })
      );
    });
  });
});
