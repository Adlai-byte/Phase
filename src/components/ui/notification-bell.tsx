"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, CreditCard, Users, Wrench, FileText, Info, X } from "lucide-react";
import { fetchNotifications, readNotification, readAllNotifications } from "@/app/actions/notifications";
import { useRouter } from "next/navigation";

const typeIcons: Record<string, { icon: typeof Bell; color: string }> = {
  PAYMENT: { icon: CreditCard, color: "bg-tertiary-fixed text-tertiary" },
  TENANT: { icon: Users, color: "bg-primary-fixed text-primary" },
  MAINTENANCE: { icon: Wrench, color: "bg-error-container text-error" },
  INVOICE: { icon: FileText, color: "bg-secondary-container text-secondary" },
  SYSTEM: { icon: Bell, color: "bg-surface-container-high text-on-surface-variant" },
  INFO: { icon: Info, color: "bg-primary-fixed text-primary" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently fail — bell will show stale/empty state
    }
  }

  async function handleRead(id: string, link?: string | null) {
    await readNotification(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (link) {
      setOpen(false);
      router.push(link);
    }
  }

  async function handleReadAll() {
    await readAllNotifications();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function timeAgo(date: string | Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-xl hover:bg-surface-container-low transition-colors"
      >
        <Bell size={20} className="text-on-surface-variant" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-2xl shadow-[0_20px_40px_-8px_rgba(24,28,30,0.12)] overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-3 flex items-center justify-between bg-surface-container-low">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="text-[11px] text-primary font-medium hover:text-primary-container transition-colors flex items-center gap-1"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto text-outline-variant mb-2" />
                <p className="text-xs text-on-surface-variant">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = typeIcons[n.type] || typeIcons.INFO;
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleRead(n.id, n.link)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-container-low transition-colors ${
                      !n.read ? "bg-primary-fixed/10" : ""
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${meta.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-medium text-on-surface truncate ${!n.read ? "font-semibold" : ""}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-outline mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
