"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
  X,
  Megaphone,
  AlertTriangle,
  Wrench,
  Sparkles,
  Info,
  Users,
  Eye,
} from "lucide-react";
import { createBroadcastAction } from "@/app/actions/broadcasts";
import { useToast } from "@/components/ui/toast";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetPlan: string | null;
  published: boolean;
  createdAt: Date;
  createdBy: { id: string; name: string };
  _count: { reads: number };
};

function getTypeBadge(type: string): {
  label: string;
  style: string;
  icon: typeof Info;
} {
  switch (type) {
    case "WARNING":
      return {
        label: "Warning",
        style: "bg-tertiary-fixed text-tertiary",
        icon: AlertTriangle,
      };
    case "MAINTENANCE":
      return {
        label: "Maintenance",
        style: "bg-error-container text-error",
        icon: Wrench,
      };
    case "UPDATE":
      return {
        label: "Update",
        style: "bg-success-container text-success",
        icon: Sparkles,
      };
    case "INFO":
    default:
      return {
        label: "Info",
        style: "bg-primary-fixed text-primary",
        icon: Info,
      };
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export default function BroadcastsClient({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(formData: FormData) {
    setSubmitting(true);
    try {
      await createBroadcastAction(formData);
      toastSuccess("Broadcast created successfully");
      setShowModal(false);
      router.refresh();
    } catch {
      toastError("Failed to create broadcast");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
            <Megaphone size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              Broadcasts
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Send announcements to platform users
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Create Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-primary-fixed rounded-lg flex items-center justify-center mb-2">
            <Bell size={16} className="text-primary" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {announcements.length}
          </p>
          <p className="text-xs text-on-surface-variant">Total Broadcasts</p>
        </div>
        {(["INFO", "WARNING", "MAINTENANCE", "UPDATE"] as const).map(
          (type) => {
            const badge = getTypeBadge(type);
            const count = announcements.filter((a) => a.type === type).length;
            if (count === 0) return null;
            return (
              <div
                key={type}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
              >
                <div
                  className={`w-9 h-9 ${badge.style.split(" ")[0]} rounded-lg flex items-center justify-center mb-2`}
                >
                  <badge.icon size={16} className="text-on-surface" />
                </div>
                <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
                  {count}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {badge.label}
                </p>
              </div>
            );
          }
        )}
      </div>

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <Megaphone size={40} className="mx-auto text-outline-variant mb-3" />
          <p className="text-base font-semibold text-on-surface mb-1">
            No broadcasts yet
          </p>
          <p className="text-sm text-on-surface-variant">
            Create your first broadcast to reach platform users.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const badge = getTypeBadge(announcement.type);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={announcement.id}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-lg ${badge.style.split(" ")[0]} flex items-center justify-center`}
                    >
                      <BadgeIcon size={14} className={badge.style.split(" ")[1]} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-on-surface truncate">
                        {announcement.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                        {announcement.targetPlan && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary-container text-secondary">
                            <Users size={10} />
                            {announcement.targetPlan}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Eye size={12} />
                      {announcement._count.reads} reads
                    </div>
                  </div>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed mb-3">
                  {announcement.message}
                </p>

                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 border-t border-outline-variant/10">
                  <span>
                    By {announcement.createdBy.name}
                  </span>
                  <span>{formatDate(announcement.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.12)] w-full max-w-lg overflow-hidden animate-fade-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
              <h2 className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
                Create Broadcast
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form action={handleCreate} className="p-6 space-y-4">
              <div>
                <label htmlFor="field-broadcast-title" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Title
                </label>
                <input
                  id="field-broadcast-title"
                  name="title"
                  required
                  placeholder="Broadcast title..."
                  className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="field-broadcast-message" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Message
                </label>
                <textarea
                  id="field-broadcast-message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Write your announcement..."
                  className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-broadcast-type" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Type
                  </label>
                  <select
                    id="field-broadcast-type"
                    name="type"
                    defaultValue="INFO"
                    className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="UPDATE">Update</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="field-broadcast-target-plan" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Target Plan
                  </label>
                  <select
                    id="field-broadcast-target-plan"
                    name="targetPlan"
                    defaultValue=""
                    className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All Plans</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
