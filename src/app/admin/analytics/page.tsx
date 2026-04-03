import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getPlatformOverview } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import AnalyticsClient from "./analytics-client";

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  // Fetch all data in parallel
  const [overview, revenueData, subscriptionCounts] = await Promise.all([
    getPlatformOverview(),
    getPlatformRevenueByMonth(6),
    getSubscriptionDistribution(),
  ]);

  return (
    <AnalyticsClient
      overview={overview}
      revenueData={revenueData}
      planDistribution={subscriptionCounts}
    />
  );
}

/**
 * Aggregate paid invoice revenue across ALL boarding houses, grouped by month.
 */
async function getPlatformRevenueByMonth(months: number) {
  const now = new Date();
  const results: { month: string; label: string; revenue: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const paid = await prisma.invoice.aggregate({
      where: {
        status: "PAID",
        paidDate: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    results.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-US", { month: "short" }),
      revenue: paid._sum.amount || 0,
    });
  }

  return results;
}

/**
 * Count subscriptions by plan and compute percentages.
 */
async function getSubscriptionDistribution() {
  const subscriptions = await prisma.subscription.groupBy({
    by: ["plan"],
    where: { status: "ACTIVE" },
    _count: { plan: true },
  });

  const total = subscriptions.reduce((sum, s) => sum + s._count.plan, 0);

  // Ensure all three plans are represented even if count is 0
  const planOrder = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];
  const countMap = new Map(subscriptions.map((s) => [s.plan, s._count.plan]));

  return planOrder.map((plan) => {
    const count = countMap.get(plan) || 0;
    return {
      plan,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}
