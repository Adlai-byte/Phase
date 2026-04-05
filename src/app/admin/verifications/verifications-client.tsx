"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldX, Mail, Phone, Calendar, Building2 } from "lucide-react";
import { approveOwnerAction, rejectOwnerAction } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";
import { getInitials } from "@/lib/utils";

type Owner = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  verified: boolean;
  createdAt: Date;
  _count: { boardingHouses: number };
};

export default function VerificationsClient({ pendingOwners }: { pendingOwners: Owner[] }) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoadingId(id);
    const result = await approveOwnerAction(id);
    if (result.success) {
      toastSuccess("Owner verified successfully");
    } else {
      toastError(result.error || "Failed to verify");
    }
    router.refresh();
    setLoadingId(null);
  }

  async function handleReject(id: string) {
    if (!confirm("Reject and delete this owner account?")) return;
    setLoadingId(id);
    const result = await rejectOwnerAction(id);
    if (result.success) {
      toastSuccess("Owner rejected and removed");
    } else {
      toastError(result.error || "Failed to reject");
    }
    router.refresh();
    setLoadingId(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Owner Verifications
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {pendingOwners.length} owner{pendingOwners.length !== 1 ? "s" : ""} awaiting verification
        </p>
      </div>

      {pendingOwners.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <ShieldCheck size={40} className="mx-auto text-success mb-3" />
          <p className="text-sm text-on-surface-variant">All owners are verified. Nothing to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOwners.map((owner) => (
            <div key={owner.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center">
                    <span className="text-sm font-bold text-tertiary">{getInitials(owner.name)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{owner.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Mail size={12} /> {owner.email}</span>
                      {owner.phone && <span className="flex items-center gap-1"><Phone size={12} /> {owner.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Joined {new Date(owner.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> {owner._count.boardingHouses} properties
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(owner.id)}
                    disabled={loadingId === owner.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <ShieldCheck size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(owner.id)}
                    disabled={loadingId === owner.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-error-container text-error hover:bg-error-container/80 transition-colors disabled:opacity-50"
                  >
                    <ShieldX size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
