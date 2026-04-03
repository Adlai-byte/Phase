import { getCurrentUser } from "@/lib/auth/get-user";
import { getOwnerBoardingHouses } from "@/lib/actions/boarding-house";
import { getRooms } from "@/lib/actions/room";
import { redirect } from "next/navigation";
import PropertiesClient from "./properties-client";

export default async function PropertiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const houses = await getOwnerBoardingHouses(user.id);
  const firstHouse = houses[0];

  const rooms = firstHouse ? await getRooms(firstHouse.id) : [];

  return <PropertiesClient houses={houses} rooms={rooms} />;
}
