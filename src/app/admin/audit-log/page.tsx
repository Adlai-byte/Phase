import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getAuditLogs } from "@/lib/actions/audit";
import { Shield, Clock, FileText } from "lucide-react";

function getActionBadgeStyle(action: string): string {
  switch (action) {
    case "VERIFY_OWNER":
      return "bg-success-container text-success";
    case "REJECT_OWNER":
      return "bg-error-container text-error";
    case "PAY_INVOICE":
      return "bg-tertiary-fixed text-tertiary";
    case "LOGIN":
      return "bg-primary-fixed text-primary";
    case "CREATE_TENANT":
      return "bg-secondary-container text-secondary";
    case "TRANSFER_ROOM":
      return "bg-primary-fixed text-primary";
    case "FLAG_LISTING":
      return "bg-error-container text-error";
    case "UNPUBLISH":
      return "bg-tertiary-fixed text-tertiary";
    case "CREATE_INVOICE":
      return "bg-secondary-container text-secondary";
    case "LOGOUT":
      return "bg-surface-container-high text-on-surface-variant";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function truncate(text: string | null, maxLength: number): string {
  if (!text) return "--";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const logs = await getAuditLogs({ limit: 50 });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
          <Shield size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Audit Log
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Track all platform operations
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-primary-fixed rounded-lg flex items-center justify-center mb-2">
            <FileText size={16} className="text-primary" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {logs.length}
          </p>
          <p className="text-xs text-on-surface-variant">Total Entries</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-secondary-container rounded-lg flex items-center justify-center mb-2">
            <Shield size={16} className="text-on-surface" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {new Set(logs.map((l) => l.action)).size}
          </p>
          <p className="text-xs text-on-surface-variant">Unique Actions</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="w-9 h-9 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-2">
            <Clock size={16} className="text-on-surface" />
          </div>
          <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
            {new Set(logs.map((l) => l.userId)).size}
          </p>
          <p className="text-xs text-on-surface-variant">Active Users</p>
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <FileText size={40} className="mx-auto text-outline-variant mb-3" />
          <p className="text-sm text-on-surface-variant">
            No audit entries yet
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Details
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Clock size={13} className="shrink-0 opacity-60" />
                        <span className="text-xs">
                          {formatTimestamp(log.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-sm font-medium text-on-surface">
                        {log.user.name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {log.user.role}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getActionBadgeStyle(log.action)}`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {log.entityType ? (
                        <div>
                          <p className="text-xs font-medium text-on-surface">
                            {log.entityType}
                          </p>
                          <p className="text-[11px] text-on-surface-variant font-mono">
                            {log.entityId
                              ? truncate(log.entityId, 12)
                              : "--"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant">
                          --
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-on-surface-variant max-w-[200px] truncate">
                        {truncate(log.details, 50)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-on-surface-variant font-mono">
                        {log.ipAddress || "--"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
