import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getTickets } from "@/lib/actions/support";
import SupportClient from "./support-client";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const tickets = await getTickets({});

  return <SupportClient tickets={tickets} />;
}
