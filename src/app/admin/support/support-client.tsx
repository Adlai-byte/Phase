"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Inbox,
  Loader2,
} from "lucide-react";
import { resolveTicketAction } from "@/app/actions/support";
import { useToast } from "@/components/ui/toast";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  response: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

function getPriorityBadge(priority: string): { label: string; style: string } {
  switch (priority) {
    case "URGENT":
      return { label: "Urgent", style: "bg-error-container text-error" };
    case "HIGH":
      return { label: "High", style: "bg-tertiary-fixed text-tertiary" };
    case "NORMAL":
      return { label: "Normal", style: "bg-primary-fixed text-primary" };
    case "LOW":
    default:
      return {
        label: "Low",
        style: "bg-surface-container-high text-on-surface-variant",
      };
  }
}

function getStatusBadge(status: string): {
  label: string;
  style: string;
  icon: typeof Clock;
} {
  switch (status) {
    case "OPEN":
      return {
        label: "Open",
        style: "bg-primary-fixed text-primary",
        icon: AlertCircle,
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        style: "bg-tertiary-fixed text-tertiary",
        icon: Loader2,
      };
    case "RESOLVED":
      return {
        label: "Resolved",
        style: "bg-success-container text-success",
        icon: CheckCircle,
      };
    case "CLOSED":
      return {
        label: "Closed",
        style: "bg-surface-container-high text-on-surface-variant",
        icon: CheckCircle,
      };
    default:
      return {
        label: status,
        style: "bg-surface-container-high text-on-surface-variant",
        icon: Clock,
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

export default function SupportClient({
  tickets,
}: {
  tickets: Ticket[];
}) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "ALL") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setResolvingId(null);
      setResponseText("");
    } else {
      setExpandedId(id);
      setResolvingId(null);
      setResponseText("");
    }
  }

  function startResolving(id: string) {
    setResolvingId(id);
    setResponseText("");
  }

  async function handleResolve(ticketId: string) {
    if (!responseText.trim()) {
      toastError("Please enter a response before resolving");
      return;
    }
    setSubmitting(true);
    try {
      await resolveTicketAction(ticketId, responseText.trim());
      toastSuccess("Ticket resolved successfully");
      setResolvingId(null);
      setResponseText("");
      setExpandedId(null);
      router.refresh();
    } catch {
      toastError("Failed to resolve ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
          <MessageSquare size={18} className="text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Support Tickets
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage and respond to user support requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-primary-fixed rounded-lg flex items-center justify-center mb-2">
            <AlertCircle size={16} className="text-primary" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {openCount}
          </p>
          <p className="text-xs text-on-surface-variant">Open</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-2">
            <Clock size={16} className="text-on-surface" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {inProgressCount}
          </p>
          <p className="text-xs text-on-surface-variant">In Progress</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-success-container rounded-lg flex items-center justify-center mb-2">
            <CheckCircle size={16} className="text-on-surface" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {resolvedCount}
          </p>
          <p className="text-xs text-on-surface-variant">Resolved</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "ALL", label: "All" },
            { key: "OPEN", label: "Open" },
            { key: "IN_PROGRESS", label: "In Progress" },
            { key: "RESOLVED", label: "Resolved" },
          ] as { key: StatusFilter; label: string }[]
        ).map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
              filter === chip.key
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {chip.label}
            {chip.key !== "ALL" && (
              <span className="ml-1.5 opacity-70">
                {chip.key === "OPEN"
                  ? openCount
                  : chip.key === "IN_PROGRESS"
                    ? inProgressCount
                    : resolvedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <Inbox size={40} className="mx-auto text-outline-variant mb-3" />
          <p className="text-base font-semibold text-on-surface mb-1">
            {filter === "ALL"
              ? "No support tickets yet"
              : `No ${filter.toLowerCase().replace("_", " ")} tickets`}
          </p>
          <p className="text-sm text-on-surface-variant">
            {filter === "ALL"
              ? "When users submit support requests, they will appear here."
              : "Try changing the filter to see other tickets."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const priority = getPriorityBadge(ticket.priority);
            const status = getStatusBadge(ticket.status);
            const StatusIcon = status.icon;
            const isExpanded = expandedId === ticket.id;
            const isResolving = resolvingId === ticket.id;

            return (
              <div
                key={ticket.id}
                className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden"
              >
                {/* Ticket header - clickable */}
                <button
                  onClick={() => toggleExpand(ticket.id)}
                  className="w-full text-left px-5 py-4 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-on-surface truncate">
                          {ticket.subject}
                        </h3>
                        <span
                          className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priority.style}`}
                        >
                          {priority.label}
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.style}`}
                        >
                          <StatusIcon size={10} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-1">
                        {ticket.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {ticket.user.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 mt-1 text-on-surface-variant">
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-outline-variant/10">
                    {/* Full message */}
                    <div className="mt-4 mb-4">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                        Full Message
                      </p>
                      <div className="bg-surface-container rounded-xl px-4 py-3">
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                          {ticket.message}
                        </p>
                      </div>
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-3 mb-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {ticket.user.name}
                      </span>
                      <span>{ticket.user.email}</span>
                    </div>

                    {/* Resolved response */}
                    {ticket.status === "RESOLVED" && ticket.response && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">
                          Admin Response
                        </p>
                        <div className="bg-success-container/20 border border-success/10 rounded-xl px-4 py-3">
                          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                            {ticket.response}
                          </p>
                          {ticket.resolvedAt && (
                            <p className="text-xs text-on-surface-variant mt-2">
                              Resolved on {formatDate(ticket.resolvedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resolve action */}
                    {ticket.status !== "RESOLVED" &&
                      ticket.status !== "CLOSED" && (
                        <>
                          {!isResolving ? (
                            <button
                              onClick={() => startResolving(ticket.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
                            >
                              <CheckCircle size={14} />
                              Resolve Ticket
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label htmlFor="field-support-response" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                                  Response
                                </label>
                                <textarea
                                  id="field-support-response"
                                  value={responseText}
                                  onChange={(e) =>
                                    setResponseText(e.target.value)
                                  }
                                  rows={3}
                                  placeholder="Type your response to the user..."
                                  className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setResolvingId(null);
                                    setResponseText("");
                                  }}
                                  className="px-4 py-2 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleResolve(ticket.id)}
                                  disabled={submitting || !responseText.trim()}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  <Send size={14} />
                                  {submitting
                                    ? "Resolving..."
                                    : "Send & Resolve"}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
