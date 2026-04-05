"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  User,
  Home,
  Calendar,
  FileText,
  Check,
  X,
  Clock,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { submitTransfer } from "@/app/actions/dashboard";

interface Tenant {
  id: string;
  name: string;
  phone: string;
  room: { id: string; number: string } | null;
}

interface Room {
  id: string;
  number: string;
  floor: number;
  monthlyRate: number;
}

interface TransferRecord {
  id: string;
  status: string;
  reason: string | null;
  createdAt: Date;
  tenant: { id: string; name: string };
  fromRoom: { id: string; number: string; floor: number };
  toRoom: { id: string; number: string; floor: number };
}

interface TransfersClientProps {
  tenants: Tenant[];
  availableRooms: Room[];
  history: TransferRecord[];
  boardingHouseId: string;
}

export default function TransfersClient({
  tenants,
  availableRooms,
  history,
  boardingHouseId,
}: TransfersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTenant, setSelectedTenant] = useState("");
  const [toRoom, setToRoom] = useState("");
  const [reason, setReason] = useState("");
  const [transferDate, setTransferDate] = useState("");

  const selectedTenantData = tenants.find((t) => t.id === selectedTenant);
  const fromRoom = selectedTenantData?.room ?? null;

  const statusStyle: Record<string, { bg: string; icon: React.ReactNode }> = {
    COMPLETED: {
      bg: "bg-success-container text-success",
      icon: <Check size={12} />,
    },
    PENDING: {
      bg: "bg-secondary-container text-secondary",
      icon: <Clock size={12} />,
    },
    CANCELLED: {
      bg: "bg-error-container text-error",
      icon: <X size={12} />,
    },
  };

  async function handleSubmit(formData: FormData) {
    const result = await submitTransfer(formData);
    if (result.success) {
      setSelectedTenant("");
      setToRoom("");
      setReason("");
      setTransferDate("");
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Room Transfers
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Transfer tenants between rooms
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
            <div className="gradient-primary px-6 py-4">
              <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-primary flex items-center gap-2">
                <ArrowLeftRight size={18} />
                Initiate Transfer
              </h2>
            </div>
            <form action={handleSubmit} className="p-6 space-y-5">
              <input type="hidden" name="fromRoomId" value={fromRoom?.id ?? ""} />

              {/* Select Tenant */}
              <div>
                <label htmlFor="field-transfer-tenant" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                  Select Tenant
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <select
                    id="field-transfer-tenant"
                    name="tenantId"
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">Choose a tenant...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.room ? `— Room ${t.room.number}` : "— No room"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* From Room (auto-filled) */}
              <div>
                <label htmlFor="field-transfer-from-room" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                  From Room
                </label>
                <div className="relative">
                  <Home
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <input
                    id="field-transfer-from-room"
                    type="text"
                    value={
                      fromRoom
                        ? `Room ${fromRoom.number}`
                        : ""
                    }
                    disabled
                    placeholder="Select a tenant first"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Visual Arrow */}
              {fromRoom && (
                <div className="flex justify-center py-1">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                    <ArrowRight size={18} className="text-primary" />
                  </div>
                </div>
              )}

              {/* To Room */}
              <div>
                <label htmlFor="field-transfer-to-room" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                  To Room
                </label>
                <div className="relative">
                  <Home
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <select
                    id="field-transfer-to-room"
                    name="toRoomId"
                    value={toRoom}
                    onChange={(e) => setToRoom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">Select destination room...</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.number} — Floor {r.floor} — ₱
                        {r.monthlyRate.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>
                {availableRooms.length === 0 && (
                  <p className="text-xs text-error mt-1">
                    No rooms available for transfer
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="field-transfer-reason" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                  Reason
                </label>
                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-3 top-3 text-outline"
                  />
                  <textarea
                    id="field-transfer-reason"
                    name="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Reason for transfer..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>

              {/* Transfer Date */}
              <div>
                <label htmlFor="field-transfer-date" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                  Transfer Date
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                  />
                  <input
                    id="field-transfer-date"
                    type="date"
                    name="transferDate"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedTenant || !toRoom || !fromRoom || isPending}
                className="w-full gradient-primary text-on-primary py-3 rounded-full font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeftRight size={16} />
                {isPending ? "Submitting..." : "Submit Transfer"}
              </button>
            </form>
          </div>
        </div>

        {/* Transfer History */}
        <div className="lg:col-span-3">
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface">
                Transfer History
              </h2>
              <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
                {history.length} records
              </span>
            </div>
            <div className="divide-y divide-surface-container-low">
              {history.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <ArrowLeftRight size={32} className="mx-auto text-outline-variant mb-3" />
                  <p className="text-sm text-on-surface-variant">No transfer history yet</p>
                </div>
              )}
              {history.map((transfer) => (
                <div
                  key={transfer.id}
                  className="px-6 py-5 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {getInitials(transfer.tenant.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {transfer.tenant.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-on-surface-variant">
                            Room {transfer.fromRoom.number}
                          </span>
                          <ArrowRight
                            size={12}
                            className="text-outline-variant"
                          />
                          <span className="text-xs font-medium text-primary">
                            Room {transfer.toRoom.number}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle[transfer.status]?.bg ?? "bg-surface-container text-on-surface-variant"}`}
                    >
                      {statusStyle[transfer.status]?.icon}
                      {transfer.status}
                    </span>
                  </div>
                  {transfer.reason && (
                    <p className="text-xs text-on-surface-variant pl-[52px]">
                      {transfer.reason}
                    </p>
                  )}
                  <p className="text-[10px] text-outline pl-[52px] mt-1.5 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(transfer.createdAt).toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
