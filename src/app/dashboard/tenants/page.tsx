import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getTenants } from "@/lib/actions/tenant";
import { redirect } from "next/navigation";
import TenantsClient from "./tenants-client";

export default async function TenantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  const firstHouse = houses[0];

  const tenants = firstHouse ? await getTenants(firstHouse.id) : [];

  const serializedTenants = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    status: t.status,
    moveInDate: t.moveInDate.toISOString(),
    room: t.room,
    boardingHouseId: firstHouse?.id ?? "",
  }));

  return (
    <TenantsClient
      tenants={serializedTenants}
      boardingHouseName={firstHouse?.name ?? "No Property"}
      boardingHouseId={firstHouse?.id ?? ""}
    />
  );
}
