import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getRevenueByMonth, getOwnerDashboardStats } from "@/lib/actions/analytics";
import { getInvoices } from "@/lib/actions/invoice";
import BillingClient from "./billing-client";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  if (houses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-on-surface-variant">
          No boarding houses found. Add a property first.
        </p>
      </div>
    );
  }

  const boardingHouseId = houses[0].id;

  const [ownerStats, revenueData, allInvoices] = await Promise.all([
    getOwnerDashboardStats(user.id),
    getRevenueByMonth(boardingHouseId, 6),
    getInvoices(boardingHouseId),
  ]);

  // Compute monthly revenue (paid invoices this month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = allInvoices
    .filter((inv) => inv.status === "PAID" && inv.paidDate && new Date(inv.paidDate) >= monthStart)
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Compute outstanding balance (PENDING + OVERDUE)
  const outstandingBalance = allInvoices
    .filter((inv) => inv.status === "PENDING" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Compute collection rate
  const totalBilled = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = allInvoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const stats = {
    totalTenants: ownerStats.totalTenants,
    totalRooms: ownerStats.totalRooms,
    occupiedRooms: ownerStats.occupiedRooms,
    availableRooms: ownerStats.availableRooms,
    occupancyRate: ownerStats.occupancyRate,
    totalRevenue: ownerStats.totalRevenue,
    pendingInvoices: ownerStats.pendingInvoices,
    monthlyRevenue: paidThisMonth,
    outstandingBalance,
    collectionRate,
  };

  // Recent paid invoices as payments
  const recentPayments = allInvoices
    .filter((inv) => inv.status === "PAID")
    .slice(0, 10)
    .map((inv) => ({
      id: inv.id,
      tenant: inv.tenant.name,
      room: inv.tenant.room?.number ?? "—",
      amount: inv.amount,
      date: inv.paidDate
        ? new Date(inv.paidDate).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
      method: inv.type,
    }));

  return (
    <BillingClient
      stats={stats}
      revenueData={revenueData}
      recentPayments={recentPayments}
    />
  );
}
