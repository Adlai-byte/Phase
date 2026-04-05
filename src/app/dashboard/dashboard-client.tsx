"use client";

import Link from "next/link";
import {
  Users,
  Home,
  Receipt,
  FileText,
  UserPlus,
  Send,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Props = {
  userName: string;
  stats: {
    totalTenants: number;
    occupancyRate: number;
    monthlyRevenue: number;
    pendingInvoices: number;
  } | null;
  revenueData: { month: string; label: string; revenue: number }[];
  recentInvoices: any[];
};

const quickActions = [
  { label: "Add New Tenant", icon: UserPlus, color: "text-primary", href: "/dashboard/tenants" },
  { label: "Generate Invoice", icon: FileText, color: "text-tertiary", href: "/dashboard/invoices" },
  { label: "Send Reminders", icon: Send, color: "text-secondary", href: "/dashboard/invoices" },
  { label: "View Reports", icon: BarChart3, color: "text-primary", href: "/dashboard/billing" },
];

export default function DashboardClient({ userName, stats, revenueData, recentInvoices }: Props) {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateString = now.toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map((d) => d.revenue), 1) : 1;

  const statCards = [
    { label: "Total Tenants", value: stats?.totalTenants?.toString() || "0", icon: Users, bgColor: "bg-secondary-container", iconColor: "text-secondary" },
    { label: "Occupancy Rate", value: `${stats?.occupancyRate || 0}%`, icon: Home, bgColor: "bg-primary-fixed", iconColor: "text-primary" },
    { label: "Monthly Revenue", value: formatCurrency(stats?.monthlyRevenue || 0), icon: Receipt, bgColor: "bg-tertiary-fixed", iconColor: "text-tertiary" },
    { label: "Pending Invoices", value: stats?.pendingInvoices?.toString() || "0", icon: FileText, bgColor: "bg-error-container", iconColor: "text-error" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant md:text-base">
          {dateString}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-shadow duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]">
            <div className="flex items-start justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-on-surface-variant" />
            </div>
            <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface">{stat.value}</p>
            <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] lg:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">Revenue Overview</h2>
              <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">Last 6 months</p>
            </div>
            {revenueData.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl bg-success-container px-3 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <span className="font-[family-name:var(--font-body)] text-xs font-semibold text-success">Revenue</span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-3 sm:gap-5" style={{ height: 200 }}>
            {revenueData.map((data) => (
              <div key={data.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant">
                  {data.revenue > 0 ? `₱${(data.revenue / 1000).toFixed(0)}k` : "₱0"}
                </span>
                <div
                  className="w-full rounded-t-xl gradient-primary transition-all duration-500 ease-out"
                  style={{ height: `${Math.max((data.revenue / maxRevenue) * 100, 2)}%`, minHeight: 4 }}
                />
                <span className="font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant">{data.label}</span>
              </div>
            ))}
            {revenueData.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant">No revenue data yet</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] lg:col-span-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">Quick Actions</h2>
          <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">Common tasks</p>
          <div className="mt-5 space-y-2.5">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 bg-surface-container-low font-[family-name:var(--font-body)] text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-200">
                <action.icon className={`h-5 w-5 ${action.color}`} />
                {action.label}
                <ArrowUpRight className="ml-auto h-4 w-4 text-on-surface-variant" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">Recent Invoices</h2>
            <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">Latest billing activity</p>
          </div>
          <Link href="/dashboard/invoices" className="rounded-xl px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-primary hover:bg-primary-fixed transition-colors duration-200">View All</Link>
        </div>
        <div className="space-y-1">
          {recentInvoices.length === 0 && (
            <p className="text-sm text-on-surface-variant py-8 text-center">No invoices yet</p>
          )}
          {recentInvoices.map((inv: any) => (
            <div key={inv.id} className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-surface-container-low transition-colors duration-200">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${inv.status === "PAID" ? "bg-success-container text-success" : inv.status === "OVERDUE" ? "bg-error-container text-error" : "bg-secondary-container text-secondary"}`}>
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-[family-name:var(--font-body)] text-sm font-medium text-on-surface">
                  {inv.tenant?.name || "Unknown"} — {inv.type}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  {inv.invoiceNumber} · <span className={`font-semibold ${inv.status === "PAID" ? "text-success" : inv.status === "OVERDUE" ? "text-error" : "text-secondary"}`}>{inv.status}</span>
                </p>
              </div>
              <span className="shrink-0 font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                {formatCurrency(inv.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
