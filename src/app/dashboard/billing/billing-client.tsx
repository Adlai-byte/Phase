"use client";

import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  Zap,
  DollarSign,
  FileText,
  Download,
  ArrowUpRight,
  CircleDollarSign,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  totalTenants: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  collectionRate: number;
}

interface RevenueDataPoint {
  month: string;
  label: string;
  revenue: number;
}

interface RecentPayment {
  id: string;
  tenant: string;
  room: string;
  amount: number;
  date: string;
  method: string;
}

interface BillingClientProps {
  stats: Stats;
  revenueData: RevenueDataPoint[];
  recentPayments: RecentPayment[];
}

export default function BillingClient({
  stats,
  revenueData,
  recentPayments,
}: BillingClientProps) {
  const maxRevenue =
    revenueData.length > 0
      ? Math.max(...revenueData.map((d) => d.revenue), 1)
      : 1;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
          Billing &amp; Payments
        </h1>
        <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant md:text-base">
          Overview of revenue, collections, and billing
        </p>
      </div>

      {/* Revenue Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Revenue This Month */}
        <div
          className="rounded-2xl bg-surface-container-lowest p-6
            shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]
            transition-shadow duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tertiary-fixed">
              <CircleDollarSign className="h-5 w-5 text-tertiary" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="font-[family-name:var(--font-body)] text-xs font-semibold text-success">
                {stats.occupancyRate}% occ.
              </span>
            </div>
          </div>
          <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface">
            {formatCurrency(stats.monthlyRevenue)}
          </p>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Total Revenue This Month
          </p>
        </div>

        {/* Outstanding Balance */}
        <div
          className="rounded-2xl bg-surface-container-lowest p-6
            shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]
            transition-shadow duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-container">
              <Receipt className="h-5 w-5 text-error" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-on-surface-variant" />
          </div>
          <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface">
            {formatCurrency(stats.outstandingBalance)}
          </p>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Outstanding Balance
          </p>
          {stats.pendingInvoices > 0 && (
            <p className="mt-0.5 font-[family-name:var(--font-body)] text-xs text-error">
              From {stats.pendingInvoices} pending invoice{stats.pendingInvoices !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Collection Rate */}
        <div
          className="rounded-2xl bg-surface-container-lowest p-6 sm:col-span-2 lg:col-span-1
            shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]
            transition-shadow duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-fixed">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-on-surface-variant" />
          </div>
          <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface">
            {stats.collectionRate}%
          </p>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Collection Rate
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
              style={{ width: `${stats.collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Revenue Chart + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Revenue Chart */}
        <div
          className="rounded-2xl bg-surface-container-lowest p-6
            shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] lg:col-span-8"
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
                Monthly Revenue
              </h2>
              <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                Revenue over the last 6 months
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-tertiary-fixed px-3.5 py-1.5">
              <CircleDollarSign className="h-3.5 w-3.5 text-tertiary" />
              <span className="font-[family-name:var(--font-body)] text-xs font-semibold text-tertiary">
                Total: {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
          </div>

          {/* Bar chart */}
          {revenueData.length > 0 ? (
            <div className="flex items-end gap-3 sm:gap-5" style={{ height: 220 }}>
              {revenueData.map((data) => {
                const heightPercent =
                  maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={data.month}
                    className="group flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {formatCurrency(data.revenue)}
                    </span>
                    <span className="font-[family-name:var(--font-body)] text-xs font-semibold text-on-surface">
                      {formatCurrency(data.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t-xl gradient-primary transition-all duration-500 ease-out"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: 8,
                      }}
                    />
                    <span className="font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant">
                      {data.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 220 }}>
              <p className="text-sm text-on-surface-variant">No revenue data yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-2xl bg-surface-container-lowest p-6
            shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] lg:col-span-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
            Quick Actions
          </h2>
          <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Billing tasks
          </p>

          <div className="mt-5 space-y-2.5">
            <Link href="/dashboard/invoices"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3
                gradient-primary
                font-[family-name:var(--font-body)] text-sm font-semibold text-on-primary
                transition-opacity duration-200 hover:opacity-90"
            >
              <FileText className="h-5 w-5" />
              Generate All Invoices
            </Link>
            <Link href="/dashboard/invoices"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3
                bg-surface-container-low
                font-[family-name:var(--font-body)] text-sm font-medium text-on-surface
                hover:bg-surface-container transition-colors duration-200"
            >
              <DollarSign className="h-5 w-5 text-tertiary" />
              Record Payment
              <ArrowUpRight className="ml-auto h-4 w-4 text-on-surface-variant" />
            </Link>
            <Link href="/dashboard/billing"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3
                bg-surface-container-low
                font-[family-name:var(--font-body)] text-sm font-medium text-on-surface
                hover:bg-surface-container transition-colors duration-200"
            >
              <Download className="h-5 w-5 text-primary" />
              Export Report
              <ArrowUpRight className="ml-auto h-4 w-4 text-on-surface-variant" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div
        className="rounded-2xl bg-surface-container-lowest p-6
          shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
              Recent Payments
            </h2>
            <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
              Latest payment transactions
            </p>
          </div>
          <Link href="/dashboard/invoices"
            className="rounded-xl px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium
              text-primary hover:bg-primary-fixed transition-colors duration-200"
          >
            View All
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt size={32} className="mx-auto text-outline-variant mb-3" />
            <p className="text-sm text-on-surface-variant">No payments recorded yet</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 px-4 py-2">
                <span className="col-span-3 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Tenant
                </span>
                <span className="col-span-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Room
                </span>
                <span className="col-span-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Amount
                </span>
                <span className="col-span-3 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Date
                </span>
                <span className="col-span-2 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Type
                </span>
              </div>
              <div className="space-y-1">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid grid-cols-12 items-center gap-4 rounded-xl px-4 py-3
                      hover:bg-surface-container-low transition-colors duration-200"
                  >
                    <span className="col-span-3 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface truncate">
                      {payment.tenant}
                    </span>
                    <span className="col-span-2 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                      Room {payment.room}
                    </span>
                    <span className="col-span-2 font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="col-span-3 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                      {payment.date}
                    </span>
                    <span className="col-span-2">
                      <span
                        className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1
                          font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant"
                      >
                        {payment.method}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-xl bg-surface-container-low p-4
                    hover:bg-surface-container transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface">
                        {payment.tenant}
                      </p>
                      <p className="mt-0.5 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        Room {payment.room}
                      </p>
                    </div>
                    <p className="font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                      {payment.date}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1
                        font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant"
                    >
                      {payment.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
