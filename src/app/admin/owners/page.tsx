import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getAllOwners } from "@/lib/actions/admin";
import OwnersClient from "./owners-client";

export default async function AdminOwnersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const owners = await getAllOwners();

  return <OwnersClient owners={owners} />;
}
