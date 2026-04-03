import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const prefix = "PH";
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 6);
  return `${prefix}-${year}${month}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "PAID":
    case "COMPLETED":
    case "APPROVED":
    case "AVAILABLE":
      return "bg-success-container text-success";
    case "PENDING":
      return "bg-secondary-container text-secondary";
    case "OVERDUE":
    case "INACTIVE":
    case "CANCELLED":
    case "MAINTENANCE":
      return "bg-error-container text-error";
    case "OCCUPIED":
      return "bg-primary-fixed text-primary";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}
