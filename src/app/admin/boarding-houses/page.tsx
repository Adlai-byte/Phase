import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Building2, MapPin, Users, Home, Shield, ShieldX } from "lucide-react";

export default async function AdminBoardingHousesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") redirect("/login");

  const houses = await prisma.boardingHouse.findMany({
    include: {
      owner: { select: { name: true, email: true } },
      rooms: { select: { status: true } },
      tenants: { where: { status: "ACTIVE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          All Boarding Houses
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {houses.length} boarding houses on the platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {houses.map((house) => {
          const occupied = house.rooms.filter((r) => r.status === "OCCUPIED").length;
          const total = house.rooms.length;
          return (
            <div
              key={house.id}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <Building2 size={18} className="text-primary" />
                </div>
                {house.verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-container text-success">
                    <Shield size={10} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container text-error">
                    <ShieldX size={10} /> Unverified
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface">
                {house.name}
              </h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                <MapPin size={12} /> {house.address}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Home size={12} /> {occupied}/{total} rooms
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {house.tenants.length} tenants
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-container-low">
                <p className="text-xs text-on-surface-variant">
                  Owner: <span className="font-medium text-on-surface">{house.owner.name}</span>
                </p>
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  house.type === "ALL_FEMALE" ? "bg-pink-100 text-pink-700" :
                  house.type === "ALL_MALE" ? "bg-sky-100 text-sky-700" :
                  "bg-secondary-container text-secondary"
                }`}>
                  {house.type.replace("_", " ")}
                </span>
                {house.published && (
                  <span className="inline-flex ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-primary">
                    Published
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
