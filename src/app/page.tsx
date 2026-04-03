import type { Metadata } from "next";
import { searchBoardingHouses } from "@/lib/actions/finder";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Phase — Find Your Perfect Boarding House in Mati City",
  description:
    "Discover safe, verified, and affordable boarding houses in Mati City, Davao Oriental. Browse rooms, compare prices, and connect with owners. The all-in-one platform for students and boarding house owners.",
  keywords: [
    "boarding house",
    "Mati City",
    "Davao Oriental",
    "student housing",
    "room for rent",
    "dormitory",
    "apartment",
    "Phase",
  ],
  openGraph: {
    title: "Phase — Find Your Perfect Boarding House in Mati City",
    description:
      "Discover safe, verified, and affordable boarding houses in Mati City. Browse rooms, compare prices, and connect with owners.",
    type: "website",
    locale: "en_PH",
    siteName: "Phase",
  },
};

export default async function LandingPage() {
  const featuredBoardingHouses = await searchBoardingHouses({});

  return <LandingClient featuredHouses={featuredBoardingHouses} />;
}
