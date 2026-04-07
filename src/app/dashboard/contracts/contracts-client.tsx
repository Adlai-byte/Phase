"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  FileText,
  Check,
  X,
  XCircle,
  PenLine,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  addContract,
  signContractAction,
  terminateContractAction,
} from "@/app/actions/dashboard";

interface Contract {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRate: number;
  depositAmount: number | null;
  terms: string | null;
  status: string;
  signedByOwner: boolean;
  signedByTenant: boolean;
  signedDate: string | null;
  tenant: { id: string; name: string };
}

interface Tenant {
  id: string;
  name: string;
}

interface ContractsClientProps {
  contracts: Contract[];
  tenants: Tenant[];
  boardingHouseId: string;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    DRAFT: "bg-secondary-container text-secondary",
    ACTIVE: "bg-success-container text-success",
    EXPIRED: "border border-outline text-on-surface-variant",
    TERMINATED: "bg-error-container text-error",
  };
  return styles[status] || "bg-surface-container-high text-on-surface-variant";
}

export default function ContractsClient({
  contracts,
  tenants,
  boardingHouseId,
}: ContractsClientProps) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(
    () => [
      {
        label: "Total Contracts",
        value: contracts.length,
        bgColor: "bg-secondary-container",
        iconColor: "text-secondary",
      },
      {
        label: "Active",
        value: contracts.filter((c) => c.status === "ACTIVE").length,
        bgColor: "bg-success-container",
        iconColor: "text-success",
      },
      {
        label: "Draft",
        value: contracts.filter((c) => c.status === "DRAFT").length,
        bgColor: "bg-primary-fixed",
        iconColor: "text-primary",
      },
      {
        label: "Expired / Terminated",
        value: contracts.filter(
          (c) => c.status === "EXPIRED" || c.status === "TERMINATED"
        ).length,
        bgColor: "bg-error-container",
        iconColor: "text-error",
      },
    ],
    [contracts]
  );

  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return contracts;
    const q = searchQuery.toLowerCase();
    return contracts.filter((c) =>
      c.tenant.name.toLowerCase().includes(q)
    );
  }, [contracts, searchQuery]);

  async function handleCreateContract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("boardingHouseId", boardingHouseId);

    const result = await addContract(formData);
    if (result.success) {
      setShowCreateModal(false);
      form.reset();
      toastSuccess("Contract created successfully");
      startTransition(() => {
        router.refresh();
      });
    } else {
      toastError(result.error || "Failed to create contract");
    }
  }

  async function handleSign(contractId: string) {
    setSigningId(contractId);
    try {
      await signContractAction(contractId, "OWNER");
      toastSuccess("Contract signed by owner");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toastError("Failed to sign contract");
    } finally {
      setSigningId(null);
    }
  }

  async function handleTerminate(contractId: string) {
    setTerminatingId(contractId);
    try {
      const result = await terminateContractAction(contractId);
      if (result.success) {
        toastSuccess("Contract terminated");
        startTransition(() => {
          router.refresh();
        });
      } else {
        toastError(result.error || "Failed to terminate contract");
      }
    } catch {
      toastError("Failed to terminate contract");
    } finally {
      setTerminatingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
            Contracts
          </h1>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Manage lease agreements and contracts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="gradient-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-[family-name:var(--font-body)] text-sm font-semibold text-on-primary shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Contract
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}
              >
                <FileText className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface">
                  {stat.value}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search by tenant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl bg-surface-container py-3.5 pl-12 pr-4 font-[family-name:var(--font-body)] text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors duration-200 focus:bg-surface-container-low"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Tenant
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Start Date
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                End Date
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Monthly Rate
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Signed By
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => (
              <tr
                key={contract.id}
                className="transition-colors duration-200 hover:bg-surface-container-low"
              >
                <td className="px-5 py-4">
                  <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface">
                    {contract.tenant.name}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                    {formatDate(contract.startDate)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                    {formatDate(contract.endDate)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                    {formatCurrency(contract.monthlyRate)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(contract.status)}`}
                  >
                    {contract.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                      Owner
                      {contract.signedByOwner ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-outline" />
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                      Tenant
                      {contract.signedByTenant ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-outline" />
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    {!contract.signedByOwner &&
                      (contract.status === "DRAFT" ||
                        contract.status === "ACTIVE") && (
                        <button
                          disabled={signingId === contract.id || isPending}
                          onClick={() => handleSign(contract.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary-fixed transition-colors disabled:opacity-50"
                          title="Sign as Owner"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                          Sign
                        </button>
                      )}
                    {contract.status === "ACTIVE" && (
                      <button
                        disabled={terminatingId === contract.id || isPending}
                        onClick={() => handleTerminate(contract.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-error hover:bg-error-container transition-colors disabled:opacity-50"
                        title="Terminate contract"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Terminate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredContracts.length === 0 && (
          <div className="text-center py-16">
            <FileText
              size={40}
              className="mx-auto text-on-surface-variant opacity-40 mb-3"
            />
            <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant">
              No contracts found
            </p>
            <p className="mt-1 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
              Create your first contract to get started
            </p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredContracts.map((contract) => (
          <div
            key={contract.id}
            className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-[family-name:var(--font-body)] text-sm font-semibold text-on-surface">
                  {contract.tenant.name}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant mt-0.5">
                  {formatDate(contract.startDate)} -{" "}
                  {formatDate(contract.endDate)}
                </p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge(contract.status)}`}
              >
                {contract.status}
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                {formatCurrency(contract.monthlyRate)}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                  Owner
                  {contract.signedByOwner ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <XCircle className="h-3 w-3 text-outline" />
                  )}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                  Tenant
                  {contract.signedByTenant ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <XCircle className="h-3 w-3 text-outline" />
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!contract.signedByOwner &&
                (contract.status === "DRAFT" ||
                  contract.status === "ACTIVE") && (
                  <button
                    disabled={signingId === contract.id || isPending}
                    onClick={() => handleSign(contract.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary bg-primary-fixed hover:bg-primary-fixed/80 transition-colors disabled:opacity-50"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Sign as Owner
                  </button>
                )}
              {contract.status === "ACTIVE" && (
                <button
                  disabled={terminatingId === contract.id || isPending}
                  onClick={() => handleTerminate(contract.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-error bg-error-container hover:bg-error-container/80 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Terminate
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredContracts.length === 0 && (
          <div className="rounded-2xl bg-surface-container-lowest px-6 py-16 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <FileText
              size={40}
              className="mx-auto text-on-surface-variant opacity-40 mb-3"
            />
            <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant">
              No contracts found
            </p>
            <p className="mt-1 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
              Create your first contract to get started
            </p>
          </div>
        )}
      </div>

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === "Escape") setShowCreateModal(false); }}>
          <div
            role="presentation"
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title-create-contract" className="relative bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="gradient-primary px-6 py-4 flex items-center justify-between">
              <h2 id="modal-title-create-contract" className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-primary">
                Create Contract
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-primary/70 hover:text-on-primary"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateContract}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label htmlFor="field-contract-tenant" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Tenant
                  </label>
                  <select
                    id="field-contract-tenant"
                    name="tenantId"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">Select tenant...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-contract-start-date" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Start Date
                    </label>
                    <input
                      id="field-contract-start-date"
                      type="date"
                      name="startDate"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-contract-end-date" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      End Date
                    </label>
                    <input
                      id="field-contract-end-date"
                      type="date"
                      name="endDate"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-contract-monthly-rate" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Monthly Rate
                    </label>
                    <input
                      id="field-contract-monthly-rate"
                      type="number"
                      name="monthlyRate"
                      required
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-contract-deposit-amount" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Deposit Amount
                    </label>
                    <input
                      id="field-contract-deposit-amount"
                      type="number"
                      name="depositAmount"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="field-contract-terms" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Terms & Conditions
                  </label>
                  <textarea
                    id="field-contract-terms"
                    name="terms"
                    rows={4}
                    placeholder="Enter contract terms and conditions..."
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
                  disabled={isPending}
                  className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  {isPending ? "Creating..." : "Create Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
