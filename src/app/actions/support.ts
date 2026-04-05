"use server";

import { resolveTicket } from "@/lib/actions/support";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

export async function resolveTicketAction(ticketId: string, response: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  return resolveTicket(ticketId, response);
}
