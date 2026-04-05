import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getContractsByHouse } from "@/lib/actions/contract";
import { getTenants } from "@/lib/actions/tenant";
import { redirect } from "next/navigation";
import ContractsClient from "./contracts-client";

export default async function ContractsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  const firstHouse = houses[0];

  if (!firstHouse) {
    return (
      <ContractsClient
        contracts={[]}
        tenants={[]}
        boardingHouseId=""
      />
    );
  }

  const [contracts, tenants] = await Promise.all([
    getContractsByHouse(firstHouse.id),
    getTenants(firstHouse.id, { status: "ACTIVE" }),
  ]);

  const serializedContracts = contracts.map((c) => ({
    id: c.id,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    monthlyRate: c.monthlyRate,
    depositAmount: c.depositAmount,
    terms: c.terms,
    status: c.status,
    signedByOwner: c.signedByOwner,
    signedByTenant: c.signedByTenant,
    signedDate: c.signedDate ? c.signedDate.toISOString() : null,
    tenant: {
      id: c.tenant.id,
      name: c.tenant.name,
    },
  }));

  const serializedTenants = tenants.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <ContractsClient
      contracts={serializedContracts}
      tenants={serializedTenants}
      boardingHouseId={firstHouse.id}
    />
  );
}
