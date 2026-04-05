import { notFound } from "next/navigation";
import Link from "next/link";
import { getBoardingHouseById } from "@/lib/actions/boarding-house";
import { getRooms } from "@/lib/actions/room";
import { MapPin, Home, Users, Shield, Wifi, Wind, Bath, Zap, Clock, ArrowLeft, Heart, Phone, Mail } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function BoardingHousePublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const house = await getBoardingHouseById(id);
  if (!house || !house.verified) notFound();

  const rooms = await getRooms(id);
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE");
  const minRate = rooms.length > 0 ? Math.min(...rooms.map((r) => r.monthlyRate)) : 0;

  const typeLabel: Record<string, { label: string; bg: string }> = {
    ALL_FEMALE: { label: "All Female", bg: "bg-pink-100 text-pink-700" },
    ALL_MALE: { label: "All Male", bg: "bg-sky-100 text-sky-700" },
    MIXED: { label: "Mixed", bg: "bg-secondary-container text-secondary" },
  };

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-40 glass shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/find" className="text-on-surface-variant hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Link href="/" className="text-xl font-bold font-[family-name:var(--font-display)] text-primary">Phase</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Login</Link>
            <Link href="/register" className="gradient-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">Register</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeLabel[house.type]?.bg || "bg-surface-container"}`}>
                  {typeLabel[house.type]?.label || house.type}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-container text-success">
                  <Shield size={10} /> Verified
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">{house.name}</h1>
              <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-2">
                <MapPin size={14} /> {house.address}, {house.city}
              </p>
            </div>

            {house.description && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
                <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-2">About</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{house.description}</p>
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(house.amenities as string[]).map((a) => (
                  <span key={a} className="px-3 py-1.5 bg-secondary-container rounded-full text-xs font-medium text-secondary">{a}</span>
                ))}
              </div>
            </div>

            {(house.restrictions as string[]).length > 0 && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
                <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-4">House Rules</h2>
                <div className="space-y-2">
                  {house.hasCurfew && (
                    <div className="flex items-center gap-2 text-sm text-on-surface">
                      <Clock size={14} className="text-on-surface-variant" /> Curfew at {house.curfewTime || "10:00 PM"}
                    </div>
                  )}
                  {(house.restrictions as string[]).map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm text-on-surface">
                      <div className="w-1.5 h-1.5 rounded-full bg-tertiary" /> {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <h2 className="text-sm font-semibold font-[family-name:var(--font-display)] text-on-surface mb-4">
                Available Rooms ({availableRooms.length} of {rooms.length})
              </h2>
              {availableRooms.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No rooms currently available. Check back later.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {availableRooms.map((room) => (
                    <div key={room.id} className="p-4 bg-surface-container-low rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-base font-bold font-[family-name:var(--font-display)] text-on-surface">Room {room.number}</p>
                        <span className="text-xs text-on-surface-variant">Floor {room.floor}</span>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(room.monthlyRate)}<span className="text-xs font-normal text-on-surface-variant">/mo</span></p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {room.hasWifi && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant"><Wifi size={10} /> WiFi</span>}
                        {room.hasAircon && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant"><Wind size={10} /> AC</span>}
                        {room.hasBathroom && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant"><Bath size={10} /> Bath</span>}
                        {room.electricityIncluded && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant"><Zap size={10} /> Elec Incl.</span>}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-2">Capacity: {room.capacity} person{room.capacity > 1 ? "s" : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="sticky top-24 space-y-4">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
                <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Starting from</p>
                <p className="text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">
                  {formatCurrency(minRate)}<span className="text-sm font-normal text-on-surface-variant">/mo</span>
                </p>
                <div className="flex items-center gap-3 mt-4 text-sm text-on-surface-variant">
                  <span className="flex items-center gap-1"><Home size={14} /> {availableRooms.length} available</span>
                  <span className="flex items-center gap-1"><Users size={14} /> {rooms.length} total rooms</span>
                </div>
                <Link href="/register" className="block w-full mt-4 py-3 rounded-full text-sm font-medium text-center gradient-primary text-on-primary hover:opacity-90 transition-opacity">
                  Contact Owner
                </Link>
              </div>

              {(house.contactPhone || house.contactEmail) && (
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
                  <h3 className="text-sm font-semibold text-on-surface mb-3">Contact</h3>
                  {house.contactPhone && (
                    <p className="text-sm text-on-surface-variant flex items-center gap-2 mb-2"><Phone size={14} /> {house.contactPhone}</p>
                  )}
                  {house.contactEmail && (
                    <p className="text-sm text-on-surface-variant flex items-center gap-2"><Mail size={14} /> {house.contactEmail}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
