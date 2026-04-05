"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Shield,
  Filter,
  ChevronDown,
  ArrowLeft,
  Heart,
  Home,
  X,
} from "lucide-react";

type FilterType = "ALL" | "ALL_FEMALE" | "ALL_MALE" | "MIXED";

type BoardingHouse = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  type: string;
  description: string | null;
  coverImage: string | null;
  hasCurfew: boolean;
  amenities: string[];
  totalRooms: number;
  availableRooms: number;
  minRate: number;
  verified: boolean;
};

export default function FinderClient({
  initialHouses,
}: {
  initialHouses: BoardingHouse[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return initialHouses.filter((bh) => {
      const matchesSearch =
        searchQuery === "" ||
        bh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bh.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "ALL" || bh.type === typeFilter;
      const matchesPrice = bh.minRate <= maxPrice;
      return matchesSearch && matchesType && matchesPrice;
    });
  }, [initialHouses, searchQuery, typeFilter, maxPrice]);

  const typeLabel: Record<string, { label: string; bg: string }> = {
    ALL_FEMALE: { label: "All Female", bg: "bg-pink-100 text-pink-700" },
    ALL_MALE: { label: "All Male", bg: "bg-sky-100 text-sky-700" },
    MIXED: { label: "Mixed", bg: "bg-secondary-container text-secondary" },
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 glass shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5">
              <ArrowLeft size={18} className="text-on-surface-variant" />
            </Link>
            <Link
              href="/"
              className="text-xl font-bold font-[family-name:var(--font-display)] text-primary"
            >
              Phase
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="gradient-primary text-on-primary px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)] text-on-surface">
            Find Boarding Houses in Mati City
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {filtered.length} boarding houses available
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-surface-container rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors md:w-auto"
            >
              <Filter size={16} />
              Filters
              <ChevronDown
                size={14}
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-surface-container-low">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Type
                  </span>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Type filter">
                    {(
                      [
                        { key: "ALL", label: "All" },
                        { key: "ALL_FEMALE", label: "Female" },
                        { key: "ALL_MALE", label: "Male" },
                        { key: "MIXED", label: "Mixed" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTypeFilter(t.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          typeFilter === t.key
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                    Max Price: {maxPrice.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 })}/mo
                  </label>
                  <input
                    type="range"
                    min={1000}
                    max={10000}
                    step={500}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-outline">
                    <span>P1,000</span>
                    <span>P10,000</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTypeFilter("ALL");
                      setMaxPrice(10000);
                      setSearchQuery("");
                    }}
                    className="text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                  >
                    <X size={12} />
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bh) => (
              <div
                key={bh.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)] transition-all group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-surface-container overflow-hidden">
                  {bh.coverImage ? (
                    <Image
                      src={bh.coverImage}
                      alt={bh.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-tertiary/20 flex items-center justify-center">
                      <Home size={48} className="text-on-surface-variant/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {typeLabel[bh.type] && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeLabel[bh.type].bg}`}
                      >
                        {typeLabel[bh.type].label}
                      </span>
                    )}
                    {bh.verified && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/90 text-primary flex items-center gap-1">
                        <Shield size={10} />
                        Verified
                      </span>
                    )}
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors">
                    <Heart size={14} className="text-on-surface-variant" />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-bold text-lg font-[family-name:var(--font-display)]">
                      {bh.minRate > 0 ? (
                        <>
                          {bh.minRate.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 })}
                          <span className="text-white/70 text-xs font-normal">
                            /mo
                          </span>
                        </>
                      ) : (
                        <span className="text-white/70 text-sm font-normal">
                          Price on inquiry
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface">
                    {bh.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <MapPin size={12} />
                    {bh.address}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <Home size={12} />
                      {bh.availableRooms} of {bh.totalRooms} rooms available
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {bh.amenities.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant"
                      >
                        {a}
                      </span>
                    ))}
                    {bh.amenities.length > 3 && (
                      <span className="px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant">
                        +{bh.amenities.length - 3}
                      </span>
                    )}
                  </div>

                  <Link href={`/find/${bh.id}`} className="block w-full mt-4 py-2.5 rounded-full text-sm font-medium text-center gradient-primary text-on-primary hover:opacity-90 transition-opacity">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Home size={48} className="mx-auto text-outline-variant mb-4" />
            <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-surface mb-1">
              No boarding houses found
            </h3>
            <p className="text-sm text-on-surface-variant">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
