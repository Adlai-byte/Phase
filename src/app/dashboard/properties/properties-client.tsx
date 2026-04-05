"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  MapPin,
  Shield,
  Home,
  Wifi,
  Wind,
  Bath,
  Zap,
  ChevronRight,
  Settings,
  Clock,
  UserPlus,
  Wrench,
  Eye,
  X,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { addBoardingHouse, addRoom } from "@/app/actions/dashboard";
import { useToast } from "@/components/ui/toast";
import { ChipSelector, AMENITY_OPTIONS, RESTRICTION_OPTIONS } from "@/components/ui/chip-selector";
import { getRoomTypeLabel, getRoomTypeBadgeColor } from "@/lib/constants/room-types";

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
};

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
  tenants: Tenant[];
};

type House = {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  verified: boolean;
  hasCurfew: boolean;
  curfewTime: string | null;
  restrictions: string | null;
  amenities: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  activeTenants: number;
};

interface PropertiesClientProps {
  houses: House[];
  rooms: Room[];
}

function RoomAmenityIcon({ icon: Icon, active }: { icon: typeof Wifi; active: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-primary-fixed text-primary"
          : "bg-surface-container text-outline"
      }`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OCCUPIED":
      return (
        <span className="inline-flex items-center rounded-full bg-primary-fixed px-3 py-1 font-[family-name:var(--font-body)] text-xs font-semibold text-primary">
          Occupied
        </span>
      );
    case "AVAILABLE":
      return (
        <span className="inline-flex items-center rounded-full bg-surface-container-low px-3 py-1 font-[family-name:var(--font-body)] text-xs font-semibold text-on-surface-variant" style={{ border: "1.5px dashed var(--color-outline)" }}>
          Available
        </span>
      );
    case "MAINTENANCE":
      return (
        <span className="inline-flex items-center rounded-full bg-error-container px-3 py-1 font-[family-name:var(--font-body)] text-xs font-semibold text-error">
          Maintenance
        </span>
      );
    default:
      return null;
  }
}

function formatHouseType(type: string): string {
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

function getHouseTypeBadgeClass(type: string): string {
  switch (type) {
    case "ALL_FEMALE":
      return "bg-pink-100 text-pink-700";
    case "ALL_MALE":
      return "bg-blue-100 text-blue-700";
    case "MIXED":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

export default function PropertiesClient({ houses, rooms }: PropertiesClientProps) {
  const house = houses[0];
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  async function handleAddProperty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await addBoardingHouse(formData);
    if (result.success) {
      setShowAddModal(false);
      toastSuccess("Property created! It will be visible after admin verification.");
      startTransition(() => { router.refresh(); });
    } else {
      toastError(result.error || "Failed to create property");
    }
  }

  async function handleAddRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!house) return;
    const formData = new FormData(e.currentTarget);
    formData.set("boardingHouseId", house.id);
    const result = await addRoom(formData);
    if (result.success) {
      setShowAddRoomModal(false);
      toastSuccess("Room added successfully");
      startTransition(() => { router.refresh(); });
    } else {
      toastError(result.error || "Failed to add room");
    }
  }

  const occupiedCount = rooms.filter((r) => r.status === "OCCUPIED").length;
  const availableCount = rooms.filter((r) => r.status === "AVAILABLE").length;
  const maintenanceCount = rooms.filter((r) => r.status === "MAINTENANCE").length;

  const statBadges = [
    { label: "Total Rooms", value: rooms.length, bg: "bg-surface-container" },
    { label: "Occupied", value: occupiedCount, bg: "bg-primary-fixed" },
    { label: "Available", value: availableCount, bg: "bg-secondary-container" },
    { label: "Maintenance", value: maintenanceCount, bg: "bg-error-container" },
  ];

  const floors = new Set(rooms.map((r) => r.floor));

  const propertyRules: { label: string; value: string | null; enabled: boolean }[] = [];

  if (house) {
    if (house.hasCurfew) {
      propertyRules.push({ label: "Curfew", value: house.curfewTime || null, enabled: true });
    }

    const restrictions: string[] = house.restrictions
      ? (() => {
          try {
            return JSON.parse(house.restrictions);
          } catch {
            return [];
          }
        })()
      : [];

    for (const restriction of restrictions) {
      propertyRules.push({ label: restriction, value: null, enabled: true });
    }
  }

  if (!house) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
              My Properties
            </h1>
            <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
              Manage your boarding houses and rooms
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-on-primary shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-all duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)] hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            Add Property
          </button>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest p-12 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <Building2 className="h-12 w-12 text-outline mb-4" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
            No properties yet
          </h2>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Add your first boarding house to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
            My Properties
          </h1>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Manage your boarding houses and rooms
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-on-primary shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-all duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)] hover:-translate-y-0.5">
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* Stats badges row */}
      <div className="flex flex-wrap gap-3">
        {statBadges.map((badge) => (
          <div
            key={badge.label}
            className={`inline-flex items-center gap-2.5 rounded-full ${badge.bg} px-4 py-2.5`}
          >
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
              {badge.value}
            </span>
            <span className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
              {badge.label}
            </span>
          </div>
        ))}
      </div>

      {/* Property Card */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Property Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Link
                  href={`/dashboard/properties/${house.id}`}
                  className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface hover:text-primary transition-colors duration-200"
                >
                  {house.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-1.5 text-on-surface-variant">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="font-[family-name:var(--font-body)] text-sm">
                    {house.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 font-[family-name:var(--font-body)] text-xs font-semibold ${getHouseTypeBadgeClass(house.type)}`}>
                {formatHouseType(house.type)}
              </span>
              {house.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1 font-[family-name:var(--font-body)] text-xs font-semibold text-success">
                  <Shield className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            {/* Amenities */}
            {house.amenities.length > 0 && (
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-on-surface">
                  Amenities
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {house.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center rounded-full bg-surface-container-low px-3 py-1.5 font-[family-name:var(--font-body)] text-xs font-medium text-on-surface-variant"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {propertyRules.length > 0 && (
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-on-surface">
                  House Rules
                </h3>
                <div className="mt-2 space-y-2">
                  {propertyRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-3">
                      <div
                        className={`h-5 w-9 rounded-full transition-colors ${
                          rule.enabled ? "bg-primary" : "bg-surface-container-high"
                        } relative`}
                      >
                        <div
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface-container-lowest shadow-sm transition-transform ${
                            rule.enabled ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                      <span className="font-[family-name:var(--font-body)] text-sm text-on-surface">
                        {rule.label}
                      </span>
                      {rule.value && (
                        <span className="flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                          <Clock className="h-3 w-3" />
                          {rule.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact / Actions */}
          <div className="flex flex-col gap-3 lg:items-end">
            {house.contactPhone && (
              <p className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                Contact: <span className="font-medium text-on-surface">{house.contactPhone}</span>
              </p>
            )}
            {house.contactEmail && (
              <p className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                Email: <span className="font-medium text-on-surface">{house.contactEmail}</span>
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Link
                href={`/dashboard/properties/${house.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-200"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Link>
              <Link href={`/dashboard/properties/${house.id}`} className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface hover:bg-surface-container transition-colors duration-200">
                <Settings className="h-4 w-4" />
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Room Management Grid */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
              Room Management
            </h2>
            <p className="mt-0.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
              {rooms.length} rooms across {floors.size} {floors.size === 1 ? "floor" : "floors"}
            </p>
          </div>
          <button onClick={() => setShowAddRoomModal(true)} className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 font-[family-name:var(--font-body)] text-sm font-semibold text-on-primary hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Add Room
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const tenantName = room.tenants[0]?.name;

            return (
              <div
                key={room.id}
                className="group rounded-2xl bg-surface-container-lowest p-5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]"
              >
                {/* Room header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface">
                        {room.number}
                      </span>
                      <StatusBadge status={room.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoomTypeBadgeColor((room as any).roomType || "BEDSPACER")}`}>
                        {getRoomTypeLabel((room as any).roomType || "BEDSPACER")}
                      </span>
                      <span className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        Floor {room.floor} · {room.capacity} pax
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-outline opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>

                {/* Tenant info (occupied) */}
                {room.status === "OCCUPIED" && tenantName && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed">
                      <span className="font-[family-name:var(--font-display)] text-xs font-bold text-primary">
                        {getInitials(tenantName)}
                      </span>
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface">
                        {tenantName}
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        Current Tenant
                      </p>
                    </div>
                  </div>
                )}

                {/* Maintenance info */}
                {room.status === "MAINTENANCE" && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-error-container">
                      <Wrench className="h-4 w-4 text-error" />
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface">
                        Under Maintenance
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        Temporarily unavailable
                      </p>
                    </div>
                  </div>
                )}

                {/* Available info */}
                {room.status === "AVAILABLE" && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low">
                      <Home className="h-4 w-4 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant">
                        Vacant
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        Ready for move-in
                      </p>
                    </div>
                  </div>
                )}

                {/* Rate */}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
                      {formatCurrency(room.monthlyRate)}
                    </p>
                    <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                      per month
                    </p>
                  </div>

                  {/* Amenity icons */}
                  <div className="flex gap-1.5">
                    <RoomAmenityIcon icon={Wind} active={room.hasAircon} />
                    <RoomAmenityIcon icon={Wifi} active={room.hasWifi} />
                    <RoomAmenityIcon icon={Bath} active={room.hasBathroom} />
                    <RoomAmenityIcon icon={Zap} active={room.electricityIncluded} />
                  </div>
                </div>

                {/* Action buttons */}
                {room.status === "AVAILABLE" && (
                  <Link href="/dashboard/tenants" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-primary px-4 py-2.5 font-[family-name:var(--font-body)] text-sm font-semibold text-on-primary transition-all duration-200 hover:shadow-[0_10px_30px_-5px_rgba(24,28,30,0.1)]">
                    <UserPlus className="h-4 w-4" />
                    Assign Tenant
                  </Link>
                )}
                {room.status === "MAINTENANCE" && (
                  <button onClick={async () => {
                    const { changeRoomStatus } = await import("@/app/actions/dashboard");
                    const result = await changeRoomStatus(room.id, "AVAILABLE");
                    if (result.success) { toastSuccess("Room marked as available"); router.refresh(); }
                    else toastError(result.error || "Failed");
                  }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-low px-4 py-2.5 font-[family-name:var(--font-body)] text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors duration-200">
                    <Wrench className="h-4 w-4" />
                    Mark Available
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === "Escape") setShowAddRoomModal(false); }}>
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setShowAddRoomModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title-add-room" className="relative bg-surface-container-lowest rounded-2xl shadow-[0_20px_40px_-8px_rgba(24,28,30,0.12)] w-full max-w-md animate-slide-up">
            <div className="gradient-primary px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 id="modal-title-add-room" className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-primary">Add New Room</h2>
              <button onClick={() => setShowAddRoomModal(false)} className="text-on-primary/70 hover:text-on-primary"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddRoom} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-room-number" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Room Number *</label>
                  <input id="field-room-number" name="number" type="text" required placeholder="e.g. 101" className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="field-room-floor" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Floor *</label>
                  <input id="field-room-floor" name="floor" type="number" required min="1" defaultValue="1" className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label htmlFor="field-room-type" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Room Type *</label>
                <select id="field-room-type" name="roomType" className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                  <option value="BEDSPACER">Bedspacer</option>
                  <option value="SOLO_ROOM">Solo Room</option>
                  <option value="DUAL_BED">Dual Bed</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="STUDIO">Studio</option>
                  <option value="FAMILY_ROOM">Family Room</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-room-monthly-rate" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Monthly Rate (₱) *</label>
                  <input id="field-room-monthly-rate" name="monthlyRate" type="number" required min="1" placeholder="3000" className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="field-room-capacity" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Capacity</label>
                  <input id="field-room-capacity" name="capacity" type="number" min="1" defaultValue="1" className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide">Amenities</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Amenities">
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input name="hasAircon" type="checkbox" className="accent-primary" /> Air Conditioning
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input name="hasWifi" type="checkbox" className="accent-primary" /> WiFi
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input name="hasBathroom" type="checkbox" className="accent-primary" /> Private Bathroom
                  </label>
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input name="electricityIncluded" type="checkbox" className="accent-primary" /> Electricity Included
                  </label>
                </div>
              </div>
              <div className="bg-surface-container-low px-6 py-4 -mx-6 -mb-6 mt-4 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setShowAddRoomModal(false)} className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancel</button>
                <button type="submit" disabled={isPending} className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2">
                  <Home size={16} />
                  {isPending ? "Adding..." : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === "Escape") setShowAddModal(false); }}>
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title-add-property" className="relative bg-surface-container-lowest rounded-2xl shadow-[0_20px_40px_-8px_rgba(24,28,30,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="gradient-primary px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 id="modal-title-add-property" className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-primary">
                Add New Property
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-on-primary/70 hover:text-on-primary">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddProperty} className="p-6 space-y-4">
              <div>
                <label htmlFor="field-property-name" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Property Name *</label>
                <input id="field-property-name" name="name" type="text" required placeholder="e.g. Casa Marina Residences"
                  className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label htmlFor="field-property-address" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Address *</label>
                <input id="field-property-address" name="address" type="text" required placeholder="e.g. Brgy. Sainz, Mati City"
                  className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-property-type" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Type *</label>
                  <select id="field-property-type" name="type" required
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option value="MIXED">Mixed</option>
                    <option value="ALL_FEMALE">All Female</option>
                    <option value="ALL_MALE">All Male</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="field-property-curfew-time" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Curfew Time</label>
                  <input id="field-property-curfew-time" name="curfewTime" type="time"
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label htmlFor="field-property-description" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Description</label>
                <textarea id="field-property-description" name="description" rows={3} placeholder="Describe your boarding house..."
                  className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <ChipSelector label="Amenities" name="amenities" options={AMENITY_OPTIONS} />
              <ChipSelector label="Restrictions" name="restrictions" options={RESTRICTION_OPTIONS} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-property-contact-phone" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Contact Phone</label>
                  <input id="field-property-contact-phone" name="contactPhone" type="tel" placeholder="0917-xxx-xxxx"
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="field-property-contact-email" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Contact Email</label>
                  <input id="field-property-contact-email" name="contactEmail" type="email" placeholder="you@email.com"
                    className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input name="hasCurfew" type="checkbox" className="accent-primary" />
                <span className="text-sm text-on-surface-variant">This property has a curfew</span>
              </div>
              <div className="bg-surface-container-low px-6 py-4 -mx-6 -mb-6 mt-6 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2">
                  <Building2 size={16} />
                  {isPending ? "Creating..." : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
