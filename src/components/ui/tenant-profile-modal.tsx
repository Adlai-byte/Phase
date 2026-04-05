"use client";

import { useState, useEffect } from "react";
import {
  X, User, Phone, Mail, Calendar, Home, Receipt, ArrowRight,
  Shield, Clock, CreditCard, Send, AlertCircle, GraduationCap, Briefcase, Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type TenantProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  tag: string | null;
  photoUrl: string | null;
  status: string;
  moveInDate: string;
  moveOutDate: string | null;
  room: { number: string; floor: number; monthlyRate: number } | null;
  boardingHouse: { name: string } | null;
  invoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    type: string;
    status: string;
    dueDate: string;
    paidDate: string | null;
    sentVia: string | null;
    sentAt: string | null;
  }[];
  transfers: {
    id: string;
    status: string;
    reason: string | null;
    createdAt: string;
    fromRoom: { number: string };
    toRoom: { number: string };
  }[];
  totalPaid: number;
  totalPending: number;
};

const tagIcons: Record<string, typeof GraduationCap> = {
  STUDENT: GraduationCap,
  WORKING_PROFESSIONAL: Briefcase,
  OTHER: Tag,
};

const tagLabels: Record<string, string> = {
  STUDENT: "Student",
  WORKING_PROFESSIONAL: "Working Professional",
  OTHER: "Other",
};

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));
}

export function TenantProfileModal({
  tenantId,
  open,
  onClose,
}: {
  tenantId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "deposits" | "history">("overview");

  useEffect(() => {
    if (!open || !tenantId) return;
    setLoading(true);
    setActiveTab("overview");
    fetch(`/api/tenant-profile/${tenantId}`)
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [open, tenantId]);

  if (!open) return null;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "payments" as const, label: `Payments (${profile?.invoices.length || 0})` },
    { key: "deposits" as const, label: `Deposits (${(profile as any)?.deposits?.length || 0})` },
    { key: "history" as const, label: `History (${profile?.transfers.length || 0})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-[0_20px_40px_-8px_rgba(24,28,30,0.12)] w-full max-w-2xl max-h-[85vh] overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="gradient-primary px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-primary">
            Tenant Profile
          </h2>
          <button onClick={onClose} className="text-on-primary/70 hover:text-on-primary">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse space-y-3">
              <div className="h-16 w-16 bg-surface-container-high rounded-full mx-auto" />
              <div className="h-4 w-32 bg-surface-container-high rounded mx-auto" />
              <div className="h-3 w-24 bg-surface-container-high rounded mx-auto" />
            </div>
          </div>
        ) : !profile ? (
          <div className="p-12 text-center text-on-surface-variant text-sm">Tenant not found</div>
        ) : (
          <>
            {/* Profile header */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-surface-container-low shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-xl font-bold text-primary shrink-0">
                {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface truncate">{profile.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    profile.status === "ACTIVE" ? "bg-success-container text-success" :
                    profile.status === "INACTIVE" ? "bg-error-container text-error" :
                    "bg-secondary-container text-secondary"
                  }`}>{profile.status}</span>
                  {profile.tag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-fixed text-tertiary">
                      {(() => { const Icon = tagIcons[profile.tag] || Tag; return <Icon size={10} />; })()}
                      {tagLabels[profile.tag] || profile.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {profile.boardingHouse?.name} · Room {profile.room?.number || "Unassigned"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold font-[family-name:var(--font-display)] text-primary">{formatCurrency(profile.totalPaid)}</p>
                <p className="text-[10px] text-on-surface-variant">Total Paid</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 shrink-0">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.key ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}>{tab.label}</button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-on-surface-variant" /> {profile.phone}</div>
                    <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-on-surface-variant" /> {profile.email || "No email"}</div>
                    <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-on-surface-variant" /> Moved in {formatDate(profile.moveInDate)}</div>
                    <div className="flex items-center gap-2 text-sm"><Home size={14} className="text-on-surface-variant" /> {profile.room ? `Room ${profile.room.number} · Floor ${profile.room.floor}` : "Unassigned"}</div>
                  </div>

                  {(profile.emergencyContact || profile.emergencyPhone) && (
                    <div className="p-3 bg-error-container/20 rounded-xl">
                      <p className="text-xs font-semibold text-error flex items-center gap-1 mb-1"><AlertCircle size={12} /> Emergency Contact</p>
                      {profile.emergencyContact && <p className="text-sm text-on-surface">{profile.emergencyContact}</p>}
                      {profile.emergencyPhone && <p className="text-xs text-on-surface-variant">{profile.emergencyPhone}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-surface-container-low rounded-xl text-center">
                      <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">{profile.invoices.length}</p>
                      <p className="text-[10px] text-on-surface-variant">Total Invoices</p>
                    </div>
                    <div className="p-3 bg-success-container/20 rounded-xl text-center">
                      <p className="text-lg font-bold font-[family-name:var(--font-display)] text-success">{formatCurrency(profile.totalPaid)}</p>
                      <p className="text-[10px] text-on-surface-variant">Total Paid</p>
                    </div>
                    <div className="p-3 bg-error-container/20 rounded-xl text-center">
                      <p className="text-lg font-bold font-[family-name:var(--font-display)] text-error">{formatCurrency(profile.totalPending)}</p>
                      <p className="text-[10px] text-on-surface-variant">Outstanding</p>
                    </div>
                  </div>

                  {profile.room && (
                    <div className="p-3 bg-surface-container-low rounded-xl">
                      <p className="text-xs font-semibold text-on-surface-variant mb-1">Current Room</p>
                      <p className="text-sm font-medium text-on-surface">Room {profile.room.number} · Floor {profile.room.floor}</p>
                      <p className="text-xs text-on-surface-variant">{formatCurrency(profile.room.monthlyRate)}/month</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-2">
                  {profile.invoices.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">No payment records</p>
                  ) : profile.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        inv.status === "PAID" ? "bg-success-container text-success" :
                        inv.status === "OVERDUE" ? "bg-error-container text-error" :
                        "bg-secondary-container text-secondary"
                      }`}>
                        <CreditCard size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-on-surface-variant">{inv.invoiceNumber}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            inv.status === "PAID" ? "bg-success-container text-success" :
                            inv.status === "OVERDUE" ? "bg-error-container text-error" :
                            "bg-secondary-container text-secondary"
                          }`}>{inv.status}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-fixed text-primary uppercase">{inv.type}</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Due {formatDate(inv.dueDate)}
                          {inv.paidDate && ` · Paid ${formatDate(inv.paidDate)}`}
                          {inv.sentVia && ` · Sent via ${inv.sentVia}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-on-surface shrink-0">{formatCurrency(inv.amount)}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "deposits" && (
                <div className="space-y-2">
                  {!(profile as any)?.deposits?.length ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">No deposits recorded</p>
                  ) : (profile as any).deposits.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        d.refundStatus === "HELD" ? "bg-primary-fixed text-primary" :
                        d.refundStatus === "FULLY_REFUNDED" ? "bg-success-container text-success" :
                        d.refundStatus === "FORFEITED" ? "bg-error-container text-error" :
                        "bg-tertiary-fixed text-tertiary"
                      }`}>
                        <Shield size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-on-surface">{formatCurrency(d.amount)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            d.refundStatus === "HELD" ? "bg-primary-fixed text-primary" :
                            d.refundStatus === "FULLY_REFUNDED" ? "bg-success-container text-success" :
                            d.refundStatus === "FORFEITED" ? "bg-error-container text-error" :
                            "bg-tertiary-fixed text-tertiary"
                          }`}>{d.refundStatus.replace("_", " ")}</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Paid {formatDate(d.datePaid)}
                          {d.refundAmount && ` · Refunded ${formatCurrency(d.refundAmount)}`}
                        </p>
                        {d.conditions && <p className="text-[10px] text-outline mt-0.5">{d.conditions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  {profile.transfers.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">No room transfers</p>
                  ) : profile.transfers.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                        <ArrowRight size={14} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-on-surface">Room {t.fromRoom.number}</span>
                          <ArrowRight size={12} className="text-on-surface-variant" />
                          <span className="text-sm font-medium text-primary">Room {t.toRoom.number}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            t.status === "COMPLETED" ? "bg-success-container text-success" :
                            t.status === "PENDING" ? "bg-secondary-container text-secondary" :
                            "bg-error-container text-error"
                          }`}>{t.status}</span>
                        </div>
                        {t.reason && <p className="text-[10px] text-on-surface-variant mt-0.5">{t.reason}</p>}
                        <p className="text-[10px] text-outline mt-0.5">{formatDate(t.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
