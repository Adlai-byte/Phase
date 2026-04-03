"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  ShieldX,
  Eye,
  Building2,
  Users,
  Mail,
  Phone,
  Download,
  Check,
  X,
  Clock,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { approveOwnerAction, rejectOwnerAction } from "@/app/actions/admin";

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

export default function OwnersClient({ owners }: { owners: Owner[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "VERIFIED" | "PENDING"
  >("ALL");
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return owners.filter((owner) => {
      const matchesSearch =
        searchQuery === "" ||
        owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "VERIFIED" && owner.verified) ||
        (statusFilter === "PENDING" && !owner.verified);
      return matchesSearch && matchesStatus;
    });
  }, [owners, searchQuery, statusFilter]);

  const selectedOwnerData = owners.find((o) => o.id === selectedOwner);

  async function handleApprove(ownerId: string) {
    setLoadingId(ownerId);
    try {
      const result = await approveOwnerAction(ownerId);
      if (!result.success) {
        alert(result.error);
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
      if (!result.success) {
        alert(result.error);
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Owner Management
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage boarding house owners and verifications
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Owners",
            value: owners.length,
            icon: Users,
            bg: "bg-secondary-container",
          },
          {
            label: "Verified",
            value: owners.filter((o) => o.verified).length,
            icon: ShieldCheck,
            bg: "bg-success-container",
          },
          {
            label: "Pending Verification",
            value: owners.filter((o) => !o.verified).length,
            icon: Clock,
            bg: "bg-tertiary-fixed",
          },
          {
            label: "Total Properties",
            value: owners.reduce((sum, o) => sum + o._count.boardingHouses, 0),
            icon: Building2,
            bg: "bg-primary-fixed",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            <div
              className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}
            >
              <stat.icon size={16} className="text-on-surface" />
            </div>
            <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
              {stat.value}
            </p>
            <p className="text-xs text-on-surface-variant">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            placeholder="Search owners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "VERIFIED", "PENDING"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {s === "ALL" ? "All" : s === "VERIFIED" ? "Verified" : "Pending"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Owner List */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
            {filtered.map((owner) => {
              const plan = owner.subscription?.plan || "None";
              return (
                <div
                  key={owner.id}
                  onClick={() => setSelectedOwner(owner.id)}
                  className={`px-5 py-4 hover:bg-surface-container-low transition-colors cursor-pointer ${
                    selectedOwner === owner.id ? "bg-primary-fixed/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {getInitials(owner.name)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-on-surface">
                            {owner.name}
                          </p>
                          {owner.verified ? (
                            <ShieldCheck
                              size={14}
                              className="text-success"
                            />
                          ) : (
                            <Clock size={14} className="text-tertiary" />
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          {owner.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-on-surface">
                        {plan === "None" ? "No plan" : plan.charAt(0) + plan.slice(1).toLowerCase()}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {owner._count.boardingHouses} properties
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Users
                  size={40}
                  className="mx-auto text-outline-variant mb-3"
                />
                <p className="text-sm text-on-surface-variant">
                  No owners found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Owner Detail */}
        <div className="lg:col-span-1">
          {selectedOwnerData ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden sticky top-24">
              <div className="gradient-primary p-5 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-on-primary">
                    {getInitials(selectedOwnerData.name)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-on-primary">
                  {selectedOwnerData.name}
                </h3>
                <span
                  className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    selectedOwnerData.verified
                      ? "bg-white/20 text-white"
                      : "bg-tertiary-fixed text-tertiary"
                  }`}
                >
                  {selectedOwnerData.verified ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Mail size={14} />
                    {selectedOwnerData.email}
                  </div>
                  {selectedOwnerData.phone && (
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Phone size={14} />
                      {selectedOwnerData.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Building2 size={14} />
                    {selectedOwnerData._count.boardingHouses} boarding houses
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Plan</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        (selectedOwnerData.subscription?.plan || "None") === "ENTERPRISE"
                          ? "bg-tertiary-fixed text-tertiary"
                          : (selectedOwnerData.subscription?.plan || "None") === "PROFESSIONAL"
                            ? "bg-primary-fixed text-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {selectedOwnerData.subscription?.plan || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Joined</span>
                    <span className="text-on-surface">
                      {new Date(
                        selectedOwnerData.createdAt
                      ).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="pt-3 flex gap-2">
                  {!selectedOwnerData.verified && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedOwnerData.id)}
                        disabled={loadingId === selectedOwnerData.id}
                        className="flex-1 py-2.5 rounded-full text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedOwnerData.id)}
                        disabled={loadingId === selectedOwnerData.id}
                        className="flex-1 py-2.5 rounded-full text-xs font-medium bg-error-container text-error hover:bg-error-container/80 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </>
                  )}
                  {selectedOwnerData.verified && (
                    <button className="flex-1 py-2.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                      View Full Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] p-8 text-center">
              <Eye size={32} className="mx-auto text-outline-variant mb-3" />
              <p className="text-sm text-on-surface-variant">
                Select an owner to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
