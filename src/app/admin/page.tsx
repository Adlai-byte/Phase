import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getPlatformOverview, getAllOwners } from "@/lib/actions/admin";
import AdminDashboardClient from "./admin-client";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const [overview, owners] = await Promise.all([
    getPlatformOverview(),
    getAllOwners(),
  ]);

  return <AdminDashboardClient overview={overview} owners={owners} />;
}
