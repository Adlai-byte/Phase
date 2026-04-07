import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardLayoutClient from "./dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.id },
    select: { plan: true },
  });

  const planLabels: Record<string, string> = {
    STARTER: "Starter Plan",
    PROFESSIONAL: "Professional Plan",
    ENTERPRISE: "Enterprise Plan",
  };

  return (
    <DashboardLayoutClient
      user={{
        name: session.name,
        plan: planLabels[subscription?.plan || "STARTER"] || "Starter Plan",
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
