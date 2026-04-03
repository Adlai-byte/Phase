import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getInvoices } from "@/lib/actions/invoice";
import { getTenants } from "@/lib/actions/tenant";
import { redirect } from "next/navigation";
import InvoicesClient from "./invoices-client";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  const boardingHouseId = houses[0]?.id;

  if (!boardingHouseId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-on-surface-variant">
          No boarding house found. Please create one first.
        </p>
      </div>
    );
  }

  const [invoices, tenants] = await Promise.all([
    getInvoices(boardingHouseId),
    getTenants(boardingHouseId, { status: "ACTIVE" }),
  ]);

  return (
    <InvoicesClient
      initialInvoices={invoices}
      boardingHouseId={boardingHouseId}
      tenants={tenants}
    />
  );
}
