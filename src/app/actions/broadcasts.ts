"use server";

import { createAnnouncement } from "@/lib/actions/announcement";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

export async function createBroadcastAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  return createAnnouncement({
    title: formData.get("title") as string,
    message: formData.get("message") as string,
    type: (formData.get("type") as string) || "INFO",
    targetPlan: (formData.get("targetPlan") as string) || undefined,
    createdById: user.id,
  });
}
