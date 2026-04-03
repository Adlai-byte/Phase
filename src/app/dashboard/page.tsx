import { getDashboardData } from "@/app/actions/dashboard";
import { getRevenueByMonth } from "@/lib/actions/analytics";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  const houseId = houses[0]?.id;

  const revenueData = houseId
    ? await getRevenueByMonth(houseId, 6)
    : [];

  const data = await getDashboardData();

  return (
    <DashboardClient
      userName={user.name.split(" ")[0]}
      stats={data.stats}
      revenueData={revenueData}
      recentInvoices={data.recentInvoices}
    />
  );
}
