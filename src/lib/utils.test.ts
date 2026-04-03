import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  getInitials,
  generateInvoiceNumber,
  getStatusColor,
  cn,
} from "./utils";

describe("cn (classname merge)", () => {
  it("merges class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "end")).toBe("base end");
  });

  it("handles undefined/null gracefully", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });
});

describe("formatCurrency", () => {
  it("formats Philippine Peso correctly", () => {
    const result = formatCurrency(3500);
    expect(result).toContain("3,500");
    expect(result).toContain("₱");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
    expect(result).toContain("₱");
  });

  it("formats decimals", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1,234");
  });

  it("formats large numbers", () => {
    const result = formatCurrency(1845000);
    expect(result).toContain("1,845,000");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-05-05"));
    expect(result).toContain("May");
    expect(result).toContain("2026");
  });

  it("formats a date string", () => {
    const result = formatDate("2026-03-15");
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
  });

  it("includes day number", () => {
    const result = formatDate(new Date("2026-12-25"));
    expect(result).toContain("25");
    expect(result).toContain("Dec");
  });
});

describe("getInitials", () => {
  it("returns first two initials", () => {
    expect(getInitials("Maria Santos")).toBe("MS");
  });

  it("returns single initial for single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("returns first two for three+ names", () => {
    expect(getInitials("Ana Maria Reyes")).toBe("AM");
  });

  it("handles leading/trailing spaces", () => {
    expect(getInitials(" Elena Magsaysay ")).toBe("EM");
  });
});

describe("generateInvoiceNumber", () => {
  it("matches PH-YYMM-XXXXXX format", () => {
    const num = generateInvoiceNumber();
    expect(num).toMatch(/^PH-\d{4}-[A-F0-9]{6}$/);
  });

  it("generates unique numbers", () => {
    const numbers = new Set<string>();
    for (let i = 0; i < 100; i++) {
      numbers.add(generateInvoiceNumber());
    }
    expect(numbers.size).toBe(100);
  });

  it("includes current year and month", () => {
    const num = generateInvoiceNumber();
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    expect(num).toContain(`PH-${year}${month}-`);
  });
});

describe("getStatusColor", () => {
  it("returns success colors for ACTIVE", () => {
    const result = getStatusColor("ACTIVE");
    expect(result).toContain("success");
  });

  it("returns success colors for PAID", () => {
    const result = getStatusColor("PAID");
    expect(result).toContain("success");
  });

  it("returns error colors for OVERDUE", () => {
    const result = getStatusColor("OVERDUE");
    expect(result).toContain("error");
  });

  it("returns error colors for MAINTENANCE", () => {
    const result = getStatusColor("MAINTENANCE");
    expect(result).toContain("error");
  });

  it("returns secondary colors for PENDING", () => {
    const result = getStatusColor("PENDING");
    expect(result).toContain("secondary");
  });

  it("returns primary colors for OCCUPIED", () => {
    const result = getStatusColor("OCCUPIED");
    expect(result).toContain("primary");
  });

  it("returns default for unknown status", () => {
    const result = getStatusColor("UNKNOWN");
    expect(result).toContain("surface");
  });

  it("is case-insensitive", () => {
    expect(getStatusColor("active")).toContain("success");
    expect(getStatusColor("Paid")).toContain("success");
    expect(getStatusColor("overdue")).toContain("error");
  });
});
