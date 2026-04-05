"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  MapPin,
  Mail,
  User,
  Eye,
  EyeOff,
  Flag,
} from "lucide-react";
import { unflagAction, unpublishAction } from "@/app/actions/moderation";
import { useToast } from "@/components/ui/toast";

type FlaggedHouse = {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  flagged: boolean;
  flagReason: string | null;
  published: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
  };
};

function getTypeBadge(type: string): { label: string; style: string } {
  switch (type) {
    case "ALL_FEMALE":
      return { label: "All Female", style: "bg-tertiary-fixed text-tertiary" };
    case "ALL_MALE":
      return { label: "All Male", style: "bg-primary-fixed text-primary" };
    case "MIXED":
    default:
      return {
        label: "Mixed",
        style: "bg-secondary-container text-secondary",
      };
  }
}

export default function ModerationClient({
  queue,
}: {
  queue: FlaggedHouse[];
}) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  async function handleUnflag(houseId: string) {
    setLoadingId(houseId);
    setActionType("unflag");
    try {
      const result = await unflagAction(houseId);
      if (result.success) {
        toastSuccess("Listing unflagged successfully");
      } else {
        toastError("Failed to unflag listing");
      }
      router.refresh();
    } catch {
      toastError("An error occurred");
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  }

  async function handleUnpublish(houseId: string) {
    if (
      !confirm(
        "Are you sure you want to unpublish this listing? It will no longer be visible to finders."
      )
    )
      return;
    setLoadingId(houseId);
    setActionType("unpublish");
    try {
      const result = await unpublishAction(houseId);
      if (result.success) {
        toastSuccess("Listing unpublished successfully");
      } else {
        toastError("Failed to unpublish listing");
      }
      router.refresh();
    } catch {
      toastError("An error occurred");
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center shrink-0">
          <ShieldAlert size={18} className="text-error" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Content Moderation
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {queue.length} flagged listing{queue.length !== 1 ? "s" : ""}{" "}
            requiring review
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-error-container rounded-lg flex items-center justify-center mb-2">
            <Flag size={16} className="text-error" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {queue.length}
          </p>
          <p className="text-xs text-on-surface-variant">Flagged Listings</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-2">
            <EyeOff size={16} className="text-on-surface" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {queue.filter((h) => !h.published).length}
          </p>
          <p className="text-xs text-on-surface-variant">Unpublished</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-success-container rounded-lg flex items-center justify-center mb-2">
            <Eye size={16} className="text-on-surface" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {queue.filter((h) => h.published).length}
          </p>
          <p className="text-xs text-on-surface-variant">Still Published</p>
        </div>
      </div>

      {/* Queue */}
      {queue.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <ShieldCheck size={40} className="mx-auto text-success mb-3" />
          <p className="text-base font-semibold text-on-surface mb-1">
            No flagged listings. All clear!
          </p>
          <p className="text-sm text-on-surface-variant">
            All boarding house listings are in good standing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((house) => {
            const typeBadge = getTypeBadge(house.type);
            const isLoading = loadingId === house.id;

            return (
              <div
                key={house.id}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* House info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-on-surface truncate">
                        {house.name}
                      </h3>
                      <span
                        className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeBadge.style}`}
                      >
                        {typeBadge.label}
                      </span>
                      {!house.published && (
                        <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-high text-on-surface-variant">
                          Unpublished
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {house.address}, {house.city}
                      </span>
                    </div>

                    {/* Flag reason */}
                    {house.flagReason && (
                      <div className="bg-error-container/30 border border-error/10 rounded-xl px-3.5 py-2.5 mb-3">
                        <p className="text-xs font-semibold text-error mb-0.5">
                          Flag Reason
                        </p>
                        <p className="text-xs text-error/80">
                          {house.flagReason}
                        </p>
                      </div>
                    )}

                    {/* Owner info */}
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {house.owner.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {house.owner.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleUnflag(house.id)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <ShieldCheck size={14} />
                      {isLoading && actionType === "unflag"
                        ? "Unflagging..."
                        : "Unflag"}
                    </button>
                    <button
                      onClick={() => handleUnpublish(house.id)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-error-container text-error hover:bg-error-container/80 transition-colors disabled:opacity-50"
                    >
                      <ShieldX size={14} />
                      {isLoading && actionType === "unpublish"
                        ? "Unpublishing..."
                        : "Unpublish"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
