import { redirect } from "next/navigation";
import { getCurrentUserWithDetails } from "@/lib/auth/get-user";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUserWithDetails();
  if (!user) redirect("/login");

  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    verified: user.verified,
    subscription: user.subscription
      ? {
          plan: user.subscription.plan,
          maxRooms: user.subscription.maxRooms,
          maxTenants: user.subscription.maxTenants,
          emailSms: user.subscription.emailSms,
          analytics: user.subscription.analytics,
          amount: user.subscription.amount,
        }
      : null,
  };

  return <SettingsClient user={serializedUser} />;
}
