import type { Metadata } from "next";
import { searchBoardingHouses } from "@/lib/actions/finder";
import FinderClient from "./finder-client";

export const metadata: Metadata = {
  title: "Find Boarding Houses — Phase | Mati City",
  description:
    "Search and compare boarding houses in Mati City. Filter by type (all-female, all-male, mixed), price range, and amenities. Find your perfect room today.",
  openGraph: {
    title: "Find Boarding Houses in Mati City — Phase",
    description:
      "Search verified boarding houses in Mati City. Filter by type, price, and amenities.",
    type: "website",
    locale: "en_PH",
    siteName: "Phase",
  },
};

export default async function FindPage() {
  const initialHouses = await searchBoardingHouses({});

  return <FinderClient initialHouses={initialHouses} />;
}
