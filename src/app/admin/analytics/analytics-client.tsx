"use client";

import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PlatformOverview = {
  totalOwners: number;
  verifiedOwners: number;
  pendingVerifications: number;
  totalBoardingHouses: number;
  totalTenants: number;
  totalRooms: number;
  totalRevenue: number;
};

type RevenueDataPoint = {
  month: string;
  label: string;
  revenue: number;
};

type PlanDistributionItem = {
  plan: string;
  count: number;
  percentage: number;
};

type Props = {
  overview: PlatformOverview;
  revenueData: RevenueDataPoint[];
  planDistribution: PlanDistributionItem[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PLAN_COLORS: Record<string, string> = {
  STARTER: "bg-surface-container-high",
  PROFESSIONAL: "bg-primary",
  ENTERPRISE: "bg-tertiary",
};

function getPlanColor(plan: string): string {
  return PLAN_COLORS[plan.toUpperCase()] || "bg-surface-container-high";
}

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    STARTER: "Starter",
    PROFESSIONAL: "Professional",
    ENTERPRISE: "Enterprise",
  };
  return labels[plan.toUpperCase()] || plan;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AnalyticsClient({
  overview,
  revenueData,
  planDistribution,
}: Props) {
  const maxRevenue = revenueData.length > 0
    ? Math.max(...revenueData.map((d) => d.revenue))
    : 1;

  const occupancyRate =
    overview.totalRooms > 0
      ? Math.round(
          ((overview.totalRooms -
            /* available rooms approximation: total rooms minus rooms with active tenants */
            Math.max(overview.totalRooms - overview.totalTenants, 0)) /
            overview.totalRooms) *
            100
        )
      : 0;

  const totalSubscriptions = planDistribution.reduce(
    (sum, p) => sum + p.count,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Platform Analytics
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Insights and performance metrics across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest rounded-full text-sm text-on-surface-variant shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <Calendar size={14} />
            Last 6 months
          </div>
          <button onClick={() => alert("Export coming soon")} className="px-4 py-2.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(overview.totalRevenue),
            change: "--",
            positive: true,
            icon: DollarSign,
            bg: "bg-tertiary-fixed",
          },
          {
            label: "Avg Occupancy",
            value: `${occupancyRate}%`,
            change: "--",
            positive: true,
            icon: BarChart3,
            bg: "bg-primary-fixed",
          },
          {
            label: "Active Tenants",
            value: overview.totalTenants.toString(),
            change: "--",
            positive: true,
            icon: Users,
            bg: "bg-secondary-container",
          },
          {
            label: "Boarding Houses",
            value: overview.totalBoardingHouses.toString(),
            change: "--",
            positive: true,
            icon: Building2,
            bg: "bg-success-container",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`}
              >
                <kpi.icon size={18} className="text-on-surface" />
              </div>
              {kpi.change !== "--" && (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    kpi.positive ? "text-success" : "text-error"
                  }`}
                >
                  {kpi.positive ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {kpi.change}
                </span>
              )}
            </div>
            <p className="text-xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              {kpi.value}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface">
              Platform Revenue Trend
            </h3>
            <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
              Monthly
            </span>
          </div>
          {revenueData.length > 0 ? (
            <div className="flex items-end gap-3 h-48">
              {revenueData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-on-surface-variant">
                    {d.revenue > 0 ? `₱${(d.revenue / 1000).toFixed(0)}k` : "₱0"}
                  </span>
                  <div
                    className="w-full gradient-primary rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      height: `${maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%`,
                      minHeight: "8px",
                    }}
                  />
                  <span className="text-[10px] text-on-surface-variant">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-on-surface-variant">
              No revenue data available yet
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-6">
            Subscription Plans
          </h3>
          {planDistribution.length > 0 ? (
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-on-surface">
                      {getPlanLabel(plan.plan)}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {plan.count} owners ({plan.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPlanColor(plan.plan)} rounded-full transition-all`}
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-on-surface-variant">
              No subscription data yet
            </div>
          )}
          <div className="mt-6 pt-4">
            <p className="text-xs text-on-surface-variant">
              Total active subscriptions
            </p>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              {totalSubscriptions}
            </p>
          </div>
        </div>
      </div>

      {/* Platform-wide Occupancy */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface">
            Platform Occupancy Overview
          </h3>
          <span className="text-xs text-on-surface-variant">All boarding houses</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-surface-container-low rounded-xl">
            <p className="text-sm font-medium text-on-surface mb-2">
              Total Rooms
            </p>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              {overview.totalRooms}
            </p>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl">
            <p className="text-sm font-medium text-on-surface mb-2">
              Active Tenants
            </p>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              {overview.totalTenants}
            </p>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl">
            <p className="text-sm font-medium text-on-surface mb-2">
              Occupancy Rate
            </p>
            <div className="mb-1.5">
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    occupancyRate >= 90
                      ? "bg-primary"
                      : occupancyRate >= 80
                        ? "bg-primary-container"
                        : "bg-tertiary"
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              {occupancyRate}%
            </p>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl">
            <p className="text-sm font-medium text-on-surface mb-2">
              Boarding Houses
            </p>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
              {overview.totalBoardingHouses}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
