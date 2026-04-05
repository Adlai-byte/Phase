export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

export const DEFAULT_TEMPLATES = {
  BEFORE_DUE: {
    subject: "Reminder: Invoice {{invoiceNumber}} due in {{days}} day(s)",
    body: "Hi {{tenantName}}, this is a reminder that your {{type}} invoice ({{invoiceNumber}}) for {{amount}} at {{boardingHouseName}} is due on {{dueDate}}. Please settle on or before the due date. Thank you! — Phase",
  },
  AFTER_DUE: {
    subject: "Overdue: Invoice {{invoiceNumber}} is {{days}} day(s) past due",
    body: "Hi {{tenantName}}, your {{type}} invoice ({{invoiceNumber}}) for {{amount}} at {{boardingHouseName}} was due on {{dueDate}} and is now {{days}} day(s) overdue. Please settle immediately to avoid penalties. — Phase",
  },
};
