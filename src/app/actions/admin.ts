"use server";

import { verifyOwner, rejectOwner } from "@/lib/actions/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");
  return user;
}

export async function approveOwnerAction(ownerId: string) {
  await requireAdmin();
  return verifyOwner(ownerId);
}

export async function rejectOwnerAction(ownerId: string) {
  await requireAdmin();
  return rejectOwner(ownerId);
}
