import { describe, it, expect } from "vitest";
import { renderTemplate, DEFAULT_TEMPLATES } from "./reminder-templates";

describe("Reminder Templates", () => {
  it("substitutes all variables", () => {
    const result = renderTemplate("Hi {{tenantName}}, you owe {{amount}}", {
      tenantName: "Maria Santos",
      amount: "₱3,500",
    });
    expect(result).toBe("Hi Maria Santos, you owe ₱3,500");
  });

  it("leaves unknown variables unchanged", () => {
    const result = renderTemplate("Hello {{name}}, code: {{code}}", { name: "Maria" });
    expect(result).toBe("Hello Maria, code: {{code}}");
  });

  it("handles empty vars", () => {
    const result = renderTemplate("No vars here", {});
    expect(result).toBe("No vars here");
  });

  it("default BEFORE_DUE template has all placeholders", () => {
    const body = DEFAULT_TEMPLATES.BEFORE_DUE.body;
    expect(body).toContain("{{tenantName}}");
    expect(body).toContain("{{amount}}");
    expect(body).toContain("{{dueDate}}");
    expect(body).toContain("{{invoiceNumber}}");
    expect(body).toContain("{{boardingHouseName}}");
  });

  it("default AFTER_DUE template includes overdue language", () => {
    const body = DEFAULT_TEMPLATES.AFTER_DUE.body;
    expect(body).toContain("overdue");
    expect(body).toContain("{{days}}");
  });
});
