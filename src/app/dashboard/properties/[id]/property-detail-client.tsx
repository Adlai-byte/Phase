"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Shield,
  Users,
  Home,
  Wifi,
  Wind,
  Bath,
  Zap,
  Clock,
  UserPlus,
  Wrench,
  Star,
  Settings,
  ChevronRight,
  Edit,
  Eye,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

type Room = {
  id: string;
  number: string;
  floor: number;
  capacity: number;
  monthlyRate: number;
  status: string;
  hasAircon: boolean;
  hasWifi: boolean;
  hasBathroom: boolean;
  electricityIncluded: boolean;
  tenants: { id: string; name: string; email: string | null; phone: string }[];
};

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  moveInDate: string;
  room: { id: string; number: string } | null;
};

type House = {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  description: string | null;
  verified: boolean;
  hasCurfew: boolean;
  curfewTime: string | null;
  amenities: string[];
  restrictions: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  tenants: Tenant[];
  owner: { id: string; name: string | null; email: string; phone: string | null };
};

interface PropertyDetailClientProps {
  house: House;
  rooms: Room[];
}

const tabs = ["Overview", "Rooms", "Tenants", "Settings"];

const amenityIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  WiFi: Wifi,
  CCTV: Eye,
  Kitchen: Home,
  Laundry: Home,
  "Study Area": Edit,
  Parking: Home,
  Gym: Home,
  Garden: Home,
  "Common Area": Home,
  "Water Included": Home,
  AC: Wind,
  "Ocean View": Eye,
  "Study Room": Edit,
};

function typeLabel(type: string): string {
  switch (type) {
    case "ALL_FEMALE":
      return "All Female";
    case "ALL_MALE":
      return "All Male";
    case "MIXED":
      return "Mixed";
    default:
      return type;
  }
}

export default function PropertyDetailClient({ house, rooms }: PropertyDetailClientProps) {
  const [activeTab, setActiveTab] = useState("Overview");

  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const totalRooms = rooms.length;
  const vacancyRate =
    totalRooms > 0
      ? Math.round(((totalRooms - occupiedRooms) / totalRooms) * 100)
      : 0;
  const monthlyRevenue = rooms
    .filter((r) => r.status === "OCCUPIED")
    .reduce((sum, r) => sum + r.monthlyRate, 0);

  const statusStyle: Record<string, string> = {
    OCCUPIED: "bg-primary-fixed text-primary",
    AVAILABLE: "bg-surface-container-low text-on-surface-variant",
    MAINTENANCE: "bg-error-container text-error",
  };

  const roomAmenities = (room: Room) => {
    const items: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [];
    if (room.hasAircon) items.push({ icon: Wind, label: "AC" });
    if (room.hasWifi) items.push({ icon: Wifi, label: "WiFi" });
    if (room.hasBathroom) items.push({ icon: Bath, label: "Bath" });
    if (room.electricityIncluded)
      items.push({ icon: Zap, label: "Elec Incl." });
    return items;
  };

  const tenantName = (room: Room): string | null => {
    if (room.tenants.length > 0) return room.tenants[0].name;
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Properties
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
                {house.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-pink-100 text-pink-700">
                {typeLabel(house.type)}
              </span>
              {house.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-container text-success">
                  <Shield size={10} />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1">
              <MapPin size={14} />
              {house.address}, {house.city}
            </p>
          </div>
          <button onClick={() => setActiveTab("Settings")} className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Edit size={16} />
            Edit Property
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Rooms", value: totalRooms, icon: Home, bg: "bg-secondary-container" },
              { label: "Occupied", value: occupiedRooms, icon: Users, bg: "bg-primary-fixed" },
              { label: "Vacancy Rate", value: `${vacancyRate}%`, icon: Building2, bg: "bg-tertiary-fixed" },
              { label: "Monthly Revenue", value: formatCurrency(monthlyRevenue), icon: Star, bg: "bg-success-container" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon size={18} className="text-on-surface" />
                </div>
                <p className="text-xl font-bold font-[family-name:var(--font-display)] text-on-surface">
                  {stat.value}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-2">
              About this Property
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {house.description || "No description provided."}
            </p>
          </div>

          {/* Amenities */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-4">
              Amenities
            </h3>
            {house.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {house.amenities.map((amenity) => {
                  const IconComponent = amenityIconMap[amenity] || Home;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl"
                    >
                      <div className="w-8 h-8 bg-secondary-container rounded-lg flex items-center justify-center">
                        <IconComponent size={16} className="text-secondary" />
                      </div>
                      <span className="text-sm text-on-surface">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No amenities listed.</p>
            )}
          </div>

          {/* House Rules */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-4">
              House Rules & Restrictions
            </h3>
            {house.hasCurfew && (
              <div className="flex items-center justify-between py-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">Curfew</p>
                    <p className="text-xs text-on-surface-variant">
                      {house.curfewTime || "Time not set"}
                    </p>
                  </div>
                </div>
                <Clock size={14} className="text-outline-variant" />
              </div>
            )}
            {house.restrictions.length > 0 ? (
              <div className="space-y-3">
                {house.restrictions.map((restriction) => (
                  <div
                    key={restriction}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          {restriction}
                        </p>
                      </div>
                    </div>
                    <Clock size={14} className="text-outline-variant" />
                  </div>
                ))}
              </div>
            ) : (
              !house.hasCurfew && (
                <p className="text-sm text-on-surface-variant">No restrictions listed.</p>
              )
            )}
          </div>
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === "Rooms" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const tenant = tenantName(room);
            return (
              <div
                key={room.id}
                className={`bg-surface-container-lowest rounded-2xl p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)] transition-all ${
                  room.status === "AVAILABLE"
                    ? "border-2 border-dashed border-outline-variant/30"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold font-[family-name:var(--font-display)] text-on-surface">
                      Room {room.number}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Floor {room.floor} · Capacity: {room.capacity}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle[room.status] || ""}`}
                  >
                    {room.status}
                  </span>
                </div>

                {tenant && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-surface-container-low rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {getInitials(tenant)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-on-surface">
                      {tenant}
                    </span>
                  </div>
                )}

                <p className="text-base font-bold text-on-surface mb-3">
                  {formatCurrency(room.monthlyRate)}
                  <span className="text-xs font-normal text-on-surface-variant">
                    /mo
                  </span>
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {roomAmenities(room).map((a) => (
                    <span
                      key={a.label}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant"
                    >
                      <a.icon size={10} />
                      {a.label}
                    </span>
                  ))}
                </div>

                {room.status === "AVAILABLE" && (
                  <Link href="/dashboard/tenants" className="w-full py-2 rounded-full text-xs font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                    <UserPlus size={12} />
                    Assign Tenant
                  </Link>
                )}
                {room.status === "MAINTENANCE" && (
                  <button onClick={async () => {
                    const { changeRoomStatus } = await import("@/app/actions/dashboard");
                    await changeRoomStatus(room.id, "AVAILABLE");
                    window.location.reload();
                  }} className="w-full py-2 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1">
                    <Wrench size={12} />
                    Mark Available
                  </button>
                )}
              </div>
            );
          })}
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Home size={40} className="mx-auto text-outline-variant mb-3" />
              <p className="text-sm text-on-surface-variant">No rooms added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === "Tenants" && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Tenant
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Room
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Move-in
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody>
                {house.tenants.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {getInitials(t.name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">
                            {t.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {t.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface">
                      {t.room ? `Room ${t.room.number}` : "Unassigned"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">
                      {new Date(t.moveInDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          t.status === "ACTIVE"
                            ? "bg-success-container text-success"
                            : t.status === "PENDING"
                              ? "bg-secondary-container text-secondary"
                              : "bg-error-container text-error"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">
                      {t.phone}
                    </td>
                  </tr>
                ))}
                {house.tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-on-surface-variant">
                      No tenants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "Settings" && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] space-y-5 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
              Property Name
            </label>
            <input
              type="text"
              defaultValue={house.name}
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
              Address
            </label>
            <input
              type="text"
              defaultValue={`${house.address}, ${house.city}`}
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                Type
              </label>
              <select
                defaultValue={house.type}
                className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="ALL_FEMALE">All Female</option>
                <option value="ALL_MALE">All Male</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                Curfew Time
              </label>
              <input
                type="time"
                defaultValue={house.curfewTime || "22:00"}
                className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              defaultValue={house.description || ""}
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setActiveTab("Overview")} className="px-5 py-2.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">
              Cancel
            </button>
            <button onClick={() => alert("Property settings saved (demo)")} className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
