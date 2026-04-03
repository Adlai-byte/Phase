"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  UserCheck,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ShieldX,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  AlertCircle,
  Settings,
} from "lucide-react";
import { formatCurrency, getInitials, getStatusColor } from "@/lib/utils";
import { approveOwnerAction, rejectOwnerAction } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";

type Owner = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  verified: boolean;
  createdAt: Date;
  subscription: { plan: string } | null;
  boardingHouses: { id: string }[];
  _count: { boardingHouses: number };
};

type Overview = {
  totalOwners: number;
  verifiedOwners: number;
  pendingVerifications: number;
  totalBoardingHouses: number;
  totalTenants: number;
  totalRooms: number;
  totalRevenue: number;
};

export default function AdminDashboardClient({
  overview,
  owners,
}: {
  overview: Overview;
  owners: Owner[];
}) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [signUpsEnabled, setSignUpsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingOwners = owners.filter((o) => !o.verified);

  const stats = [
    {
      label: "Total Owners",
      value: overview.totalOwners,
      icon: Users,
      change: `${overview.verifiedOwners} verified`,
      bgClass: "bg-primary-fixed",
      iconColor: "text-primary",
    },
    {
      label: "Boarding Houses",
      value: overview.totalBoardingHouses,
      icon: Building2,
      change: `${overview.totalRooms} total rooms`,
      bgClass: "bg-secondary-container",
      iconColor: "text-secondary",
    },
    {
      label: "Total Tenants",
      value: overview.totalTenants,
      icon: UserCheck,
      change: "Active tenants",
      bgClass: "bg-success-container",
      iconColor: "text-success",
    },
    {
      label: "Platform Revenue",
      value: formatCurrency(overview.totalRevenue),
      icon: DollarSign,
      change: "From paid invoices",
      bgClass: "bg-tertiary-fixed",
      iconColor: "text-tertiary",
    },
  ];

  async function handleApprove(ownerId: string) {
    setLoadingId(ownerId);
    try {
      const result = await approveOwnerAction(ownerId);
      if (result.success) {
        toastSuccess("Owner verified successfully");
      } else {
        toastError(result.error || "Failed to verify owner");
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(ownerId: string) {
    if (!confirm("Are you sure you want to reject this owner? This will delete their account.")) return;
    setLoadingId(ownerId);
    try {
      const result = await rejectOwnerAction(ownerId);
      if (result.success) {
        toastSuccess("Owner rejected and removed");
      } else {
        toastError(result.error || "Failed to reject owner");
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-[family-name:var(--font-display)]">
            Platform Overview
          </h1>
          <p className="text-on-surface-variant text-sm font-[family-name:var(--font-body)] mt-1">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant font-[family-name:var(--font-body)]">
          <TrendingUp className="w-4 h-4 text-success" />
          <span>
            {overview.pendingVerifications} pending verification{overview.pendingVerifications !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-all hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-2xl ${stat.bgClass} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-on-surface font-[family-name:var(--font-display)]">
              {typeof stat.value === "number"
                ? stat.value.toLocaleString()
                : stat.value}
            </p>
            <p className="text-sm text-on-surface-variant font-[family-name:var(--font-body)] mt-1">
              {stat.label}
            </p>
            <p className="text-xs text-on-surface-variant/60 font-[family-name:var(--font-body)] mt-2">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Pending Verifications */}
      {pendingOwners.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="p-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-tertiary-fixed flex items-center justify-center">
                <AlertCircle className="w-4.5 h-4.5 text-tertiary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-on-surface font-[family-name:var(--font-display)]">
                  Pending Verifications
                </h2>
                <p className="text-xs text-on-surface-variant font-[family-name:var(--font-body)]">
                  {pendingOwners.length} owner{pendingOwners.length > 1 ? "s" : ""} awaiting review
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                    Owner
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                    Joined
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingOwners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center">
                          <span className="text-xs font-semibold text-tertiary font-[family-name:var(--font-display)]">
                            {getInitials(owner.name)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-on-surface font-[family-name:var(--font-body)]">
                          {owner.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant font-[family-name:var(--font-body)]">
                      {owner.email}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant font-[family-name:var(--font-body)]">
                      {new Date(owner.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(owner.id)}
                          disabled={loadingId === owner.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-container text-success text-xs font-semibold font-[family-name:var(--font-body)] hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(owner.id)}
                          disabled={loadingId === owner.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-container text-error text-xs font-semibold font-[family-name:var(--font-body)] hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                          <ShieldX className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Owner List */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="p-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-on-surface font-[family-name:var(--font-display)]">
                Registered Owners
              </h2>
              <p className="text-xs text-on-surface-variant font-[family-name:var(--font-body)]">
                {owners.length} total owners on the platform
              </p>
            </div>
          </div>
          <a
            href="/admin/owners"
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-container transition-colors font-[family-name:var(--font-body)]"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                  Email
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                  Properties
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                  Plan
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider font-[family-name:var(--font-body)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => {
                const plan = owner.subscription?.plan || "None";
                return (
                  <tr
                    key={owner.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary font-[family-name:var(--font-display)]">
                            {getInitials(owner.name)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-on-surface font-[family-name:var(--font-body)]">
                          {owner.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant font-[family-name:var(--font-body)]">
                      {owner.email}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface text-center font-[family-name:var(--font-body)]">
                      {owner._count.boardingHouses}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold font-[family-name:var(--font-body)] ${
                          plan === "ENTERPRISE"
                            ? "bg-tertiary-fixed text-tertiary"
                            : plan === "PROFESSIONAL"
                              ? "bg-primary-fixed text-primary"
                              : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {plan === "None" ? "None" : plan.charAt(0) + plan.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold font-[family-name:var(--font-body)] ${getStatusColor(
                          owner.verified ? "ACTIVE" : "PENDING"
                        )}`}
                      >
                        {owner.verified ? "Verified" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Controls */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center">
            <Settings className="w-4.5 h-4.5 text-secondary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-on-surface font-[family-name:var(--font-display)]">
              Platform Controls
            </h2>
            <p className="text-xs text-on-surface-variant font-[family-name:var(--font-body)]">
              Manage global platform settings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* New Sign-ups Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low">
            <div>
              <p className="text-sm font-medium text-on-surface font-[family-name:var(--font-body)]">
                New Sign-ups
              </p>
              <p className="text-xs text-on-surface-variant font-[family-name:var(--font-body)] mt-0.5">
                Allow new owners to register on the platform
              </p>
            </div>
            <button
              onClick={() => setSignUpsEnabled(!signUpsEnabled)}
              className="focus:outline-none"
            >
              {signUpsEnabled ? (
                <ToggleRight className="w-10 h-10 text-success" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-on-surface-variant/40" />
              )}
            </button>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low">
            <div>
              <p className="text-sm font-medium text-on-surface font-[family-name:var(--font-body)]">
                Maintenance Mode
              </p>
              <p className="text-xs text-on-surface-variant font-[family-name:var(--font-body)] mt-0.5">
                Temporarily disable the platform for maintenance
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className="focus:outline-none"
            >
              {maintenanceMode ? (
                <ToggleRight className="w-10 h-10 text-error" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-on-surface-variant/40" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
