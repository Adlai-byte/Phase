import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getOverdueTenants } from "@/lib/actions/reminder";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
  Send,
} from "lucide-react";

function escalationColor(days: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (days > 30) {
    return {
      bg: "bg-error-container",
      text: "text-error",
      border: "border-error/20",
      label: "Critical",
    };
  }
  if (days > 7) {
    return {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-200",
      label: "Escalated",
    };
  }
  return {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Recent",
  };
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default async function OverduePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  const firstHouse = houses[0];

  const overdueItems = firstHouse
    ? await getOverdueTenants(firstHouse.id)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
            Overdue Tenants
          </h1>
          <AlertTriangle className="h-6 w-6 text-error" />
        </div>
        <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
          Tenants with outstanding payments past their due date
        </p>
      </div>

      {/* Summary */}
      {overdueItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-container">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface">
                  {overdueItems.length}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  Overdue Invoices
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-container">
                <FileText className="h-5 w-5 text-error" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface">
                  {formatCurrency(
                    overdueItems.reduce((sum, item) => sum + item.amount, 0)
                  )}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  Total Outstanding
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface">
                  {overdueItems.length > 0
                    ? Math.max(...overdueItems.map((i) => i.daysOverdue))
                    : 0}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  Max Days Overdue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {overdueItems.length === 0 && (
        <div className="rounded-2xl bg-surface-container-lowest px-6 py-20 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-container">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
            All payments are up to date!
          </h2>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            No tenants have overdue invoices. Great job keeping things on track.
          </p>
          <Link
            href="/dashboard/invoices"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-5 py-2.5 font-[family-name:var(--font-body)] text-sm font-medium text-primary transition-colors hover:bg-primary-fixed/80"
          >
            <FileText className="h-4 w-4" />
            View All Invoices
          </Link>
        </div>
      )}

      {/* Overdue Cards */}
      {overdueItems.length > 0 && (
        <div className="space-y-3">
          {overdueItems.map((item) => {
            const esc = escalationColor(item.daysOverdue);
            return (
              <div
                key={item.invoice.id}
                className={`rounded-2xl bg-surface-container-lowest p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] border ${esc.border} transition-shadow duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Tenant Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${esc.bg}`}
                    >
                      <User className={`h-5 w-5 ${esc.text}`} />
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-body)] text-sm font-semibold text-on-surface">
                        {item.tenant.name}
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant mt-0.5">
                        {item.tenant.room
                          ? `Room ${item.tenant.room.number}`
                          : "No room assigned"}
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant mt-0.5">
                        Invoice: {item.invoice.invoiceNumber}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Days */}
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        Due: {formatDate(item.invoice.dueDate)}
                      </p>
                    </div>
                    <div
                      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${esc.bg}`}
                    >
                      <span
                        className={`font-[family-name:var(--font-display)] text-sm font-bold ${esc.text}`}
                      >
                        {item.daysOverdue}
                      </span>
                      <span
                        className={`text-[9px] font-medium uppercase ${esc.text}`}
                      >
                        days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/30 pt-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${esc.bg} ${esc.text}`}
                  >
                    <Clock className="h-3 w-3" />
                    {esc.label}
                  </span>
                  <div className="flex-1" />
                  <Link
                    href="/dashboard/invoices"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-[family-name:var(--font-body)] text-xs font-medium text-primary hover:bg-primary-fixed transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Reminder
                  </Link>
                  <Link
                    href={`/dashboard/tenants`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    View Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
