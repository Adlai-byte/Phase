import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getAllOwners } from "@/lib/actions/admin";
import VerificationsClient from "./verifications-client";

export default async function AdminVerificationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const owners = await getAllOwners();
  const pending = owners.filter((o) => !o.verified);

  return <VerificationsClient pendingOwners={pending} />;
}
