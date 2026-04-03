import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getBoardingHouseById } from "@/lib/actions/boarding-house";
import { getRooms } from "@/lib/actions/room";
import PropertyDetailClient from "./property-detail-client";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const house = await getBoardingHouseById(id);
  if (!house) notFound();

  if (house.ownerId !== user.id) notFound();

  const rooms = await getRooms(id);

  const serializedHouse = {
    id: house.id,
    name: house.name,
    address: house.address,
    city: house.city,
    type: house.type,
    description: house.description,
    verified: house.verified,
    hasCurfew: house.hasCurfew,
    curfewTime: house.curfewTime,
    amenities: house.amenities,
    restrictions: house.restrictions,
    contactPhone: house.contactPhone,
    contactEmail: house.contactEmail,
    tenants: house.tenants.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      status: t.status,
      moveInDate: t.moveInDate.toISOString(),
      room: t.room ? { id: t.room.id, number: t.room.number } : null,
    })),
    owner: house.owner,
  };

  const serializedRooms = rooms.map((r) => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    capacity: r.capacity,
    monthlyRate: r.monthlyRate,
    status: r.status,
    hasAircon: r.hasAircon,
    hasWifi: r.hasWifi,
    hasBathroom: r.hasBathroom,
    electricityIncluded: r.electricityIncluded,
    tenants: r.tenants.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
    })),
  }));

  return <PropertyDetailClient house={serializedHouse} rooms={serializedRooms} />;
}
