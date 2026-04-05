"use server";

import {
  flagBoardingHouse,
  unflagBoardingHouse,
  unpublishBoardingHouse,
} from "@/lib/actions/moderation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "SUPERADMIN") redirect("/login");
  return u;
}

export async function unflagAction(houseId: string) {
  await requireAdmin();
  return unflagBoardingHouse(houseId);
}

export async function unpublishAction(houseId: string) {
  await requireAdmin();
  return unpublishBoardingHouse(houseId);
}

export async function flagAction(houseId: string, reason: string) {
  await requireAdmin();
  return flagBoardingHouse(houseId, reason);
}
