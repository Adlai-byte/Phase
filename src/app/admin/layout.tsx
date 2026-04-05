"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { ToastProvider } from "@/components/ui/toast";
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Owners", href: "/admin/owners", icon: Users },
  { label: "Boarding Houses", href: "/admin/boarding-houses", icon: Building2 },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
  { label: "Audit Log", href: "/admin/audit-log", icon: Settings },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Broadcasts", href: "/admin/broadcasts", icon: Bell },
  { label: "Support", href: "/admin/support", icon: MessageSquare },
  { label: "Platform", href: "/admin/platform", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-inverse-primary/20 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-inverse-primary" />
          </div>
          <div>
            <span className="text-lg font-bold text-white font-[family-name:var(--font-display)]">
              Phase
            </span>
            <span className="text-[10px] font-medium text-inverse-primary ml-1.5 bg-inverse-primary/15 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/10 text-white border-l-2 border-inverse-primary"
                  : "text-inverse-on-surface/70 hover:bg-white/5 hover:text-inverse-on-surface border-l-2 border-transparent"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              <span className="font-[family-name:var(--font-body)]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-3">
        <button onClick={() => logoutAction()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-inverse-on-surface/50 hover:bg-white/5 hover:text-inverse-on-surface/70 transition-all cursor-pointer">
          <LogOut className="w-4.5 h-4.5" />
          <span className="text-sm font-[family-name:var(--font-body)]">
            Sign out
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-inverse-surface flex flex-col transform transition-transform duration-200 ease-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-5 right-4 text-inverse-on-surface/60 hover:text-inverse-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-inverse-surface">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-on-primary" />
              </div>
              <span className="font-bold text-on-surface font-[family-name:var(--font-display)]">
                Phase Admin
              </span>
            </div>
            <div className="w-9" />
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8"><ToastProvider>{children}</ToastProvider></main>
      </div>
    </div>
  );
}
