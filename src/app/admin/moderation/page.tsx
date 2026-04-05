import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getModerationQueue } from "@/lib/actions/moderation";
import ModerationClient from "./moderation-client";

export default async function ModerationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const queue = await getModerationQueue();

  return <ModerationClient queue={queue} />;
}
