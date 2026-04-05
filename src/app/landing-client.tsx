"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Home,
  Users,
  Star,
  Shield,
  Check,
  Wifi,
  Wind,
  ChevronRight,
  ArrowRight,
  Building2,
  Receipt,
  Bell,
  BarChart3,
  MessageSquare,
  Clock,
  Heart,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FeaturedHouse = {
  id: string;
  name: string;
  address: string;
  city: string;
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

function typeBadge(type: string) {
  switch (type) {
    case "ALL_FEMALE":
      return {
        label: "Female Only",
        bg: "bg-pink-100 text-pink-700",
      };
    case "ALL_MALE":
      return {
        label: "Male Only",
        bg: "bg-sky-100 text-sky-700",
      };
    default:
      return {
        label: "Mixed",
        bg: "bg-secondary-container text-on-secondary-container",
      };
  }
}

function amenityIcon(a: string) {
  if (a.toLowerCase().includes("wifi")) return <Wifi className="size-3.5" />;
  if (a.toLowerCase().includes("ac")) return <Wind className="size-3.5" />;
  return null;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LandingClient({
  featuredHouses,
}: {
  featuredHouses: FeaturedHouse[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const displayedHouses = featuredHouses.slice(0, 6);

  return (
    <div className="min-h-screen bg-surface font-[family-name:var(--font-body)]">
      {/* ============================================================ */}
      {/*  NAVBAR                                                       */}
      {/* ============================================================ */}
      <nav className="glass fixed top-0 right-0 left-0 z-50 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-primary"
          >
            Phase
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#featured"
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              Find a Room
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              Pricing
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-full px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container">
              Log in
            </Link>
            <Link href="/register" className="gradient-primary cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-on-primary shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-shadow hover:shadow-[0_20px_40px_-8px_rgba(0,77,100,0.18)]">
              Register
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-6 rounded bg-on-surface transition-transform ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-6 rounded bg-on-surface transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-6 rounded bg-on-surface transition-transform ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="glass border-t border-outline-variant/20 px-5 pb-6 md:hidden">
            <div className="flex flex-col gap-4 pt-4">
              <a
                href="#featured"
                className="text-sm font-medium text-on-surface-variant"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find a Room
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-on-surface-variant"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-on-surface-variant"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="rounded-full px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" className="gradient-primary rounded-full px-5 py-2.5 text-sm font-semibold text-on-primary" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ============================================================ */}
      {/*  HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-24 pb-16 md:px-8">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute top-0 -left-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-tertiary/5 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-1.5 text-xs font-semibold text-on-secondary-container">
            <MapPin className="size-3.5" />
            Mati City, Davao Oriental
          </div>

          {/* Heading */}
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight font-extrabold tracking-tight text-on-surface sm:text-5xl md:text-6xl lg:text-7xl">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              Boarding House
            </span>{" "}
            in Mati City
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
            Whether you&apos;re a student heading to campus or a professional
            starting fresh, Phase helps you discover safe, verified, and
            affordable rooms in seconds.
          </p>

          {/* Search bar */}
          <div className="glass mt-10 w-full max-w-3xl rounded-2xl p-2 shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)] md:p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
              {/* Location */}
              <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-surface-container-lowest px-4 py-3 md:rounded-r-none">
                <MapPin className="size-4 shrink-0 text-primary" />
                <select className="w-full appearance-none bg-transparent text-sm font-medium text-on-surface outline-none">
                  <option>All Barangays</option>
                  <option>Brgy. Sainz</option>
                  <option>Brgy. Central</option>
                  <option>Brgy. Matiao</option>
                  <option>Brgy. Dahican</option>
                  <option>Brgy. Badas</option>
                </select>
              </div>

              {/* Type filter */}
              <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-surface-container-lowest px-4 py-3 md:rounded-none">
                <Users className="size-4 shrink-0 text-primary" />
                <select
                  className="w-full appearance-none bg-transparent text-sm font-medium text-on-surface outline-none"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="female">Female Only</option>
                  <option value="male">Male Only</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              {/* Price range */}
              <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-surface-container-lowest px-4 py-3 md:rounded-none">
                <Receipt className="size-4 shrink-0 text-primary" />
                <select className="w-full appearance-none bg-transparent text-sm font-medium text-on-surface outline-none">
                  <option>Any Price</option>
                  <option>Under ₱2,500</option>
                  <option>₱2,500 – ₱3,500</option>
                  <option>₱3,500 – ₱5,000</option>
                  <option>₱5,000+</option>
                </select>
              </div>

              {/* Search button */}
              <Link href="/find" className="gradient-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-on-primary transition-shadow hover:shadow-[0_20px_40px_-8px_rgba(0,77,100,0.18)] md:rounded-l-none md:rounded-r-xl">
                <Search className="size-4" />
                <span>Search</span>
              </Link>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {[
              { label: "Rooms", value: "500+", icon: Home },
              { label: "Boarding Houses", value: "40+", icon: Building2 },
              { label: "Satisfaction", value: "98%", icon: Heart },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="size-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-on-surface">
                    {stat.value}
                  </p>
                  <p className="text-xs text-on-surface-variant">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURED PROPERTIES                                          */}
      {/* ============================================================ */}
      <section id="featured" className="scroll-mt-24 px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold tracking-wide text-primary uppercase">
                Top picks for you
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                Featured Boarding Houses
              </h2>
            </div>
            <Link
              href="/find"
              className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-container"
            >
              View all listings <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedHouses.map((house) => {
              const badge = typeBadge(house.type);
              return (
                <article
                  key={house.id}
                  className="group relative rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-surface-container">
                    <Image
                      src={house.coverImage || PLACEHOLDER_IMAGE}
                      alt={house.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Verified badge */}
                    {house.verified && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
                        <Shield className="size-3 fill-primary text-primary" />
                        Verified
                      </div>
                    )}

                    {/* Favourite button */}
                    <button className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-surface-container-lowest/80 text-on-surface-variant backdrop-blur-sm transition-colors hover:text-red-500">
                      <Heart className="size-4" />
                    </button>

                    {/* Bottom info overlay */}
                    <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-white drop-shadow">
                          {house.name}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-white/80">
                          <MapPin className="size-3" />
                          {house.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    {/* Type & New badge row */}
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 text-xs font-semibold text-on-surface">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        New
                      </span>
                    </div>

                    {/* Price & availability */}
                    <div className="mb-3 flex items-baseline justify-between">
                      <p className="font-[family-name:var(--font-display)] text-xl font-extrabold text-primary">
                        {house.minRate > 0
                          ? `From ${formatCurrency(house.minRate)}`
                          : "Contact for price"}
                        {house.minRate > 0 && (
                          <span className="text-sm font-medium text-on-surface-variant">
                            /mo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        <span className="font-semibold text-success">
                          {house.availableRooms}
                        </span>{" "}
                        of {house.totalRooms} available
                      </p>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5">
                      {house.amenities.map((a) => (
                        <span
                          key={a}
                          className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface-variant"
                        >
                          {amenityIcon(a)}
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                 */}
      {/* ============================================================ */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-surface-container-lowest px-5 py-20 md:px-8"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-primary uppercase">
            Simple process
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">
            Finding your next room takes three easy steps. No hassle, no
            middlemen.
          </p>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search & Filter",
                desc: "Browse verified listings by location, type, budget, and amenities. Every property is vetted for your safety.",
              },
              {
                step: "02",
                icon: MessageSquare,
                title: "Contact the Owner",
                desc: "Send a direct inquiry or schedule a visit. Chat in real-time through the platform with no personal number shared.",
              },
              {
                step: "03",
                icon: Home,
                title: "Move In",
                desc: "Reserve your room online, sign a digital agreement, and move in. We make the transition seamless.",
              },
            ].map((item) => (
              <div key={item.step} className="group relative flex flex-col items-center">
                <div className="relative mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <item.icon className="size-7 text-primary" />
                  <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-tertiary font-[family-name:var(--font-display)] text-xs font-bold text-on-tertiary">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES FOR OWNERS (Bento Grid)                             */}
      {/* ============================================================ */}
      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wide text-primary uppercase">
              For boarding house owners
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              Manage Your Boarding House with Ease
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">
              Phase gives you a complete toolkit to manage tenants, rooms, and
              payments from one beautiful dashboard.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Tenant Management - spans 2 cols */}
            <div className="flex flex-col justify-between rounded-2xl bg-primary p-6 text-on-primary md:col-span-2 lg:col-span-2">
              <div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-white/15">
                  <Users className="size-6" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                  Tenant Management
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-on-primary/80">
                  Track every tenant from application to move-out. Manage
                  profiles, agreements, balances, and room assignments all in one
                  place.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm font-medium text-on-primary/70">
                <Check className="size-4" /> Profiles &amp; contacts
                <Check className="size-4" /> Room assignments
                <Check className="size-4" /> Move-in/out tracking
              </div>
            </div>

            {/* Billing */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-tertiary/10">
                <Receipt className="size-6 text-tertiary" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
                Billing & Invoicing
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Auto-generate invoices, track payments, and send reminders. Never
                miss a due date again.
              </p>
            </div>

            {/* Room Management */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="size-6 text-primary" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-on-surface">
                Room Management
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                Visual floor plans, occupancy tracking, room status updates, and
                maintenance scheduling all at a glance.
              </p>
            </div>

            {/* SMS/Email Notifications - spans 2 cols */}
            <div className="flex flex-col justify-between rounded-2xl bg-secondary-container p-6 md:col-span-2 lg:col-span-2">
              <div>
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="size-6 text-primary" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface">
                  SMS & Email Notifications
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-on-surface-variant">
                  Keep tenants informed with automatic billing reminders,
                  announcements, and maintenance updates via SMS or email.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-on-surface-variant">
                <span className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1.5">
                  <Clock className="size-3.5" /> Scheduled sends
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1.5">
                  <MessageSquare className="size-3.5" /> SMS & Email
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1.5">
                  <BarChart3 className="size-3.5" /> Delivery tracking
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      <section className="bg-surface-container-lowest px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wide text-primary uppercase">
              What people say
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              Trusted by Students & Owners
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Angela Dela Cruz",
                role: "Student, DOrSU",
                text: "I found my boarding house in less than 10 minutes. The filters made it so easy to find a female-only dorm near campus. I felt safe the whole time.",
                rating: 5,
              },
              {
                name: "Elena Magsaysay",
                role: "Boarding House Owner",
                text: "Phase transformed how I manage my properties. Billing used to take me hours -- now it's automatic. My tenants even pay on time more often thanks to the reminders.",
                rating: 5,
              },
              {
                name: "Marco Villanueva",
                role: "Working Professional",
                text: "Just transferred to Mati for work and needed something affordable fast. Phase had verified listings with real photos. Moved in within a week.",
                rating: 5,
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-2xl bg-surface p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-on-surface-variant">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-[family-name:var(--font-display)] text-sm font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {t.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING                                                      */}
      {/* ============================================================ */}
      <section id="pricing" className="scroll-mt-24 px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wide text-primary uppercase">
              Pricing for owners
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-on-surface-variant">
              Start for free and scale as your business grows. No hidden fees,
              cancel anytime.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-7 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <p className="text-sm font-semibold text-on-surface-variant">
                Starter
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-on-surface">
                Free
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Perfect for getting started
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-on-surface-variant">
                {[
                  "Up to 10 rooms",
                  "Up to 15 tenants",
                  "Basic dashboard",
                  "Property listing",
                  "Email support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-8 block w-full cursor-pointer rounded-full bg-surface-container py-3 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high">
                Get Started Free
              </Link>
            </div>

            {/* Professional - highlighted */}
            <div className="relative flex flex-col rounded-2xl bg-surface-container-lowest p-7 shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]">
              {/* Gradient border effect via outline ring */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary-container p-[2px]">
                <div className="h-full w-full rounded-[14px] bg-surface-container-lowest" />
              </div>
              <div className="relative z-10">
                <div className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  Most Popular
                </div>
                <p className="text-sm font-semibold text-on-surface-variant">
                  Professional
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-on-surface">
                  ₱999
                  <span className="text-lg font-medium text-on-surface-variant">
                    /mo
                  </span>
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  For growing businesses
                </p>
                <ul className="mt-6 flex flex-col gap-3 text-sm text-on-surface-variant">
                  {[
                    "Up to 30 rooms",
                    "Up to 50 tenants",
                    "Email & SMS notifications",
                    "Analytics & reports",
                    "Priority email support",
                    "Invoice automation",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="gradient-primary mt-8 block w-full cursor-pointer rounded-full py-3 text-center text-sm font-semibold text-on-primary transition-shadow hover:shadow-[0_20px_40px_-8px_rgba(0,77,100,0.18)]">
                  Start 14-Day Trial
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-7 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
              <p className="text-sm font-semibold text-on-surface-variant">
                Enterprise
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-on-surface">
                ₱2,499
                <span className="text-lg font-medium text-on-surface-variant">
                  /mo
                </span>
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                For large operations
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-on-surface-variant">
                {[
                  "Unlimited rooms",
                  "Unlimited tenants",
                  "Priority phone support",
                  "Full analytics suite",
                  "Custom branding",
                  "API access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-8 block w-full cursor-pointer rounded-full bg-surface-container py-3 text-center text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA SECTION                                                  */}
      {/* ============================================================ */}
      <section className="px-5 py-20 md:px-8">
        <div className="gradient-primary mx-auto max-w-5xl rounded-2xl px-8 py-16 text-center md:px-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-on-primary md:text-4xl">
            Ready to List Your Boarding House?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-on-primary/80 md:text-base">
            Join 40+ boarding house owners in Mati City already using Phase to
            manage their properties and reach more tenants.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="flex cursor-pointer items-center gap-2 rounded-full bg-surface-container-lowest px-8 py-3.5 text-sm font-semibold text-primary shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-shadow hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]">
              Register Your Property
              <ArrowRight className="size-4" />
            </Link>
            <a href="#how-it-works" className="flex cursor-pointer items-center gap-2 rounded-full bg-white/15 px-8 py-3.5 text-sm font-semibold text-on-primary backdrop-blur-sm transition-colors hover:bg-white/25">
              Learn More
              <ChevronRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-inverse-surface px-5 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <p className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-inverse-primary">
                Phase
              </p>
              <p className="mt-3 text-sm leading-relaxed text-inverse-on-surface/70">
                The all-in-one platform for finding and managing boarding houses
                in Mati City, Davao Oriental.
              </p>
            </div>

            {/* For Tenants */}
            <div>
              <p className="mb-4 text-xs font-semibold tracking-wider text-inverse-on-surface/50 uppercase">
                For Tenants
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-inverse-on-surface/70">
                <li><Link href="/find" className="transition-colors hover:text-inverse-primary">Browse Listings</Link></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-inverse-primary">How It Works</a></li>
                <li><Link href="/find" className="transition-colors hover:text-inverse-primary">Search Rooms</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-inverse-primary">Sign Up</Link></li>
              </ul>
            </div>

            {/* For Owners */}
            <div>
              <p className="mb-4 text-xs font-semibold tracking-wider text-inverse-on-surface/50 uppercase">
                For Owners
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-inverse-on-surface/70">
                <li><Link href="/register" className="transition-colors hover:text-inverse-primary">List Your Property</Link></li>
                <li><a href="#pricing" className="transition-colors hover:text-inverse-primary">Pricing</a></li>
                <li><Link href="/login" className="transition-colors hover:text-inverse-primary">Owner Dashboard</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-inverse-primary">Get Started</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="mb-4 text-xs font-semibold tracking-wider text-inverse-on-surface/50 uppercase">
                Company
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-inverse-on-surface/70">
                <li><Link href="/" className="transition-colors hover:text-inverse-primary">About Phase</Link></li>
                <li><Link href="/privacy" className="transition-colors hover:text-inverse-primary">Privacy Policy</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-inverse-primary">Terms of Service</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-inverse-primary">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-xs text-inverse-on-surface/50">
              &copy; 2026 Phase. Built for Mati City, Davao Oriental. All rights
              reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-inverse-on-surface/50">
              <MapPin className="size-3" />
              Mati City, Davao Oriental, Philippines
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
