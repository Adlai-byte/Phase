"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationBell } from "@/components/ui/notification-bell";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Home,
  Building2,
  Users,
  Receipt,
  FileText,
  ArrowLeftRight,
  AlertCircle,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard/tenants", icon: Users },
  { label: "Billing", href: "/dashboard/billing", icon: Receipt },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Room Transfer", href: "/dashboard/transfers", icon: ArrowLeftRight },
  { label: "Contracts", href: "/dashboard/contracts", icon: FileText },
  { label: "Overdue", href: "/dashboard/overdue", icon: AlertCircle },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function getPageTitle(pathname: string): string {
  const item = navItems.find((nav) =>
    pathname === nav.href
      ? true
      : nav.href !== "/dashboard" && pathname.startsWith(nav.href)
  );
  return item?.label ?? "Dashboard";
}

type DashboardUser = {
  name: string;
  plan: string;
};

export default function DashboardLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: DashboardUser;
}) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-on-surface/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface-container-lowest
          shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]
          transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <span className="font-[family-name:var(--font-display)] text-sm font-bold text-on-primary">
                P
              </span>
            </div>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-primary">
              Phase
            </span>
          </Link>
          <button
            className="rounded-xl p-1.5 text-on-surface-variant hover:bg-surface-container-low md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5
                  font-[family-name:var(--font-body)] text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "border-l-2 border-primary bg-primary-fixed text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }
                `}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive
                      ? "text-primary"
                      : "text-on-surface-variant group-hover:text-on-surface"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Owner profile */}
        <div className="p-3">
          <div
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center gap-3 rounded-xl p-3
              hover:bg-surface-container-low transition-colors duration-200"
            onClick={() => setProfileOpen(!profileOpen)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfileOpen(!profileOpen); } }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-fixed">
              <span className="font-[family-name:var(--font-display)] text-xs font-bold text-primary">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-[family-name:var(--font-body)] text-sm font-semibold text-on-surface">
                {user.name}
              </p>
              <p className="truncate font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                {user.plan}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="mt-1 space-y-1 rounded-xl bg-surface-container-low p-2">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2
                  font-[family-name:var(--font-body)] text-sm text-on-surface-variant
                  hover:bg-surface-container hover:text-on-surface transition-colors duration-200"
                onClick={() => {
                  setProfileOpen(false);
                  setSidebarOpen(false);
                }}
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </Link>
              <button
                onClick={() => logoutAction()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2
                  font-[family-name:var(--font-body)] text-sm text-error
                  hover:bg-error-container transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-16 shrink-0 items-center gap-4 px-4 md:px-8
            glass shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
        >
          {/* Mobile hamburger */}
          <button
            className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-low md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title */}
          <h1 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface md:text-xl">
            {pageTitle}
          </h1>

          <div className="flex-1" />

          {/* Search */}
          <SearchBar />

          {/* Notification bell */}
          <NotificationBell />

          {/* User avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed">
            <span className="font-[family-name:var(--font-display)] text-xs font-bold text-primary">
              {initials}
            </span>
          </div>
        </header>

        {/* Impersonation Banner */}
        <ImpersonationBanner />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}

function ImpersonationBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // phase-impersonate is httpOnly so we check via API
    fetch("/api/impersonation-check").then(r => r.json()).then(d => setShow(d.impersonating)).catch(() => {});
  }, []);
  if (!show) return null;
  return (
    <div className="bg-tertiary text-on-tertiary px-4 py-2 flex items-center justify-between text-sm">
      <span className="font-medium">You are viewing as this owner (admin impersonation)</span>
      <button onClick={async () => {
        const { stopImpersonation } = await import("@/app/actions/auth");
        await stopImpersonation();
      }} className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold hover:bg-white/30 transition-colors">
        Return to Admin
      </button>
    </div>
  );
}
