"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Search,
  Eye,
  Mail,
  MessageSquare,
  FileText,
  Receipt,
  Send,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { addInvoice, sendInvoice, payInvoice } from "@/app/actions/dashboard";

type FilterStatus = "ALL" | "PENDING" | "PAID" | "OVERDUE";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: string;
  type: string;
  description: string | null;
  sentVia: string | null;
  sentAt: Date | null;
  tenantId: string;
  boardingHouseId: string;
  tenant: {
    name: string;
    email: string | null;
    phone: string;
    room: { number: string } | null;
  };
}

interface Tenant {
  id: string;
  name: string;
  room: { id: string; number: string; floor: number; monthlyRate: number } | null;
}

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  boardingHouseId: string;
  tenants: Tenant[];
}

export default function InvoicesClient({
  initialInvoices,
  boardingHouseId,
  tenants,
}: InvoicesClientProps) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const invoices = initialInvoices;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesFilter =
        activeFilter === "ALL" || inv.status === activeFilter;
      const matchesSearch =
        searchQuery === "" ||
        inv.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [invoices, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: invoices.length,
      pending: invoices.filter((i) => i.status === "PENDING").length,
      paid: invoices.filter((i) => i.status === "PAID").length,
      overdue: invoices.filter((i) => i.status === "OVERDUE").length,
    };
  }, [invoices]);

  const summary = useMemo(() => {
    return {
      total: invoices.reduce((sum, i) => sum + i.amount, 0),
      paid: invoices
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + i.amount, 0),
      pending: invoices
        .filter((i) => i.status === "PENDING")
        .reduce((sum, i) => sum + i.amount, 0),
      overdue: invoices
        .filter((i) => i.status === "OVERDUE")
        .reduce((sum, i) => sum + i.amount, 0),
    };
  }, [invoices]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-success-container text-success",
      PENDING: "bg-secondary-container text-secondary",
      OVERDUE: "bg-error-container text-error",
    };
    return styles[status] || "bg-surface-container-high text-on-surface-variant";
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      RENT: "bg-primary-fixed text-primary",
      ELECTRICITY: "bg-tertiary-fixed text-tertiary",
    };
    return styles[type] || "bg-surface-container-high text-on-surface-variant";
  };

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.all },
    { key: "PENDING", label: "Pending", count: counts.pending },
    { key: "PAID", label: "Paid", count: counts.paid },
    { key: "OVERDUE", label: "Overdue", count: counts.overdue },
  ];

  async function handleCreateInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("boardingHouseId", boardingHouseId);

    const result = await addInvoice(formData);
    if (result.success) {
      setShowCreateModal(false);
      form.reset();
      toastSuccess("Invoice created successfully");
      startTransition(() => { router.refresh(); });
    } else {
      toastError(result.error || "Failed to create invoice");
    }
  }

  async function handleSendInvoice(invoiceId: string, channel: "EMAIL" | "SMS" | "BOTH") {
    setSendingId(invoiceId);
    try {
      const result = await sendInvoice(invoiceId, channel);
      if (result.success) {
        toastSuccess(`Invoice sent via ${channel}`);
      } else {
        toastError(result.error || "Failed to send invoice");
      }
      startTransition(() => { router.refresh(); });
    } finally {
      setSendingId(null);
    }
  }

  async function handlePayInvoice(invoiceId: string) {
    setPayingId(invoiceId);
    try {
      const result = await payInvoice(invoiceId);
      if (result.success) {
        toastSuccess("Invoice marked as paid");
        startTransition(() => { router.refresh(); });
      } else {
        toastError(result.error || "Failed to mark invoice as paid");
      }
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Invoices
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage and track all tenant invoices
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="gradient-primary text-on-primary px-5 py-2.5 rounded-full font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            placeholder="Search by tenant or invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container rounded-xl text-on-surface placeholder:text-outline font-[family-name:var(--font-body)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeFilter === f.key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {f.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeFilter === f.key
                    ? "bg-white/20"
                    : "bg-surface-container-high"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: summary.total, icon: Receipt, bg: "bg-surface-container-lowest" },
          { label: "Total Paid", value: summary.paid, icon: FileText, bg: "bg-success-container/30" },
          { label: "Total Pending", value: summary.pending, icon: FileText, bg: "bg-secondary-container/30" },
          { label: "Total Overdue", value: summary.overdue, icon: FileText, bg: "bg-error-container/30" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]`}>
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={16} className="text-on-surface-variant" />
              <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{item.label}</span>
            </div>
            <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Invoice #
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Tenant
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Type
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Amount
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Due Date
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Sent Via
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-surface-container-low transition-colors"
              >
                <td className="px-5 py-4">
                  <span className="text-sm font-mono font-medium text-on-surface">
                    {inv.invoiceNumber}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {inv.tenant.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Room {inv.tenant.room?.number ?? "N/A"}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeBadge(inv.type)}`}
                  >
                    {inv.type}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-on-surface">
                    {formatCurrency(inv.amount)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-on-surface-variant">
                    {new Date(inv.dueDate).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(inv.status)}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {inv.sentVia ? (
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      {(inv.sentVia === "EMAIL" || inv.sentVia === "BOTH") && (
                        <Mail size={14} />
                      )}
                      {(inv.sentVia === "SMS" || inv.sentVia === "BOTH") && (
                        <MessageSquare size={14} />
                      )}
                      <span className="text-xs">{inv.sentVia}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-outline">Not sent</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    {!inv.sentVia && (
                      <button
                        disabled={sendingId === inv.id}
                        onClick={() => handleSendInvoice(inv.id, "EMAIL")}
                        className="p-1.5 rounded-lg hover:bg-primary-fixed text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                        title="Send via email"
                      >
                        <Send size={14} />
                      </button>
                    )}
                    {inv.status !== "PAID" && (
                      <button
                        disabled={payingId === inv.id}
                        onClick={() => handlePayInvoice(inv.id)}
                        className="p-1.5 rounded-lg hover:bg-success-container text-on-surface-variant hover:text-success transition-colors disabled:opacity-50"
                        title="Mark as paid"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    {inv.status === "PAID" && (
                      <button
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        title="View invoice"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-outline-variant mb-3" />
            <p className="text-on-surface-variant text-sm">
              No invoices found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.map((inv) => (
          <div
            key={inv.id}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-mono text-on-surface-variant">
                  {inv.invoiceNumber}
                </p>
                <p className="text-sm font-semibold text-on-surface mt-0.5">
                  {inv.tenant.name}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Room {inv.tenant.room?.number ?? "N/A"}
                </p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(inv.status)}`}
              >
                {inv.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeBadge(inv.type)}`}
                >
                  {inv.type}
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {formatCurrency(inv.amount)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {inv.status !== "PAID" ? (
                  <button
                    disabled={payingId === inv.id}
                    onClick={() => handlePayInvoice(inv.id)}
                    className="p-1.5 rounded-lg hover:bg-success-container text-on-surface-variant hover:text-success disabled:opacity-50"
                    title="Mark as paid"
                  >
                    <Eye size={14} />
                  </button>
                ) : (
                  <button
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                    title="View invoice"
                  >
                    <Eye size={14} />
                  </button>
                )}
                {!inv.sentVia && (
                  <button
                    disabled={sendingId === inv.id}
                    onClick={() => handleSendInvoice(inv.id, "EMAIL")}
                    className="p-1.5 rounded-lg hover:bg-primary-fixed text-on-surface-variant hover:text-primary disabled:opacity-50"
                    title="Send via email"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === "Escape") setShowCreateModal(false); }}>
          <div
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title-create-invoice" className="relative bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="gradient-primary px-6 py-4 flex items-center justify-between">
              <h2 id="modal-title-create-invoice" className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-primary">
                Create Invoice
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-primary/70 hover:text-on-primary"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="field-invoice-tenant" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Tenant
                  </label>
                  <select
                    id="field-invoice-tenant"
                    name="tenantId"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">Select tenant...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.room ? ` - Room ${t.room.number}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-invoice-type" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Type
                    </label>
                    <select
                      id="field-invoice-type"
                      name="type"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="RENT">Rent</option>
                      <option value="ELECTRICITY">Electricity</option>
                      <option value="WATER">Water</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="field-invoice-amount" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Amount
                    </label>
                    <input
                      id="field-invoice-amount"
                      type="number"
                      name="amount"
                      required
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="field-invoice-due-date" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Due Date
                  </label>
                  <input
                    id="field-invoice-due-date"
                    type="date"
                    name="dueDate"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label htmlFor="field-invoice-description" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    id="field-invoice-description"
                    name="description"
                    rows={2}
                    placeholder="Add a note..."
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
              <div className="bg-surface-container-low px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                  <Send size={16} />
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
