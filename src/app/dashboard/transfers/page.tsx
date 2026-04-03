import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getRooms } from "@/lib/actions/room";
import { getTenants } from "@/lib/actions/tenant";
import { getTransferHistory } from "@/lib/actions/transfer";
import TransfersClient from "./transfers-client";

export default async function TransfersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  if (houses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-on-surface-variant">
          No boarding houses found. Add a property first.
        </p>
      </div>
    );
  }

  const boardingHouseId = houses[0].id;

  const [allRooms, activeTenants, history] = await Promise.all([
    getRooms(boardingHouseId),
    getTenants(boardingHouseId, { status: "ACTIVE" }),
    getTransferHistory(boardingHouseId),
  ]);

  const availableRooms = allRooms
    .filter((r) => r.status === "AVAILABLE")
    .map((r) => ({
      id: r.id,
      number: r.number,
      floor: r.floor,
      monthlyRate: r.monthlyRate,
    }));

  const tenants = activeTenants.map((t) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    room: t.room ? { id: t.room.id, number: t.room.number } : null,
  }));

  const serializedHistory = history.map((h) => ({
    id: h.id,
    status: h.status,
    reason: h.reason,
    createdAt: h.createdAt,
    tenant: h.tenant,
    fromRoom: h.fromRoom,
    toRoom: h.toRoom,
  }));

  return (
    <TransfersClient
      tenants={tenants}
      availableRooms={availableRooms}
      history={serializedHistory}
      boardingHouseId={boardingHouseId}
    />
  );
}
