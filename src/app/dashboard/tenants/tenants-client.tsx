"use client";

import { useState, useMemo } from "react";
import {
  UserPlus,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { formatCurrency, getInitials, getStatusColor } from "@/lib/utils";

type TenantRoom = {
  id: string;
  number: string;
  floor: number;
  monthlyRate: number;
} | null;

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  moveInDate: Date | string;
  room: TenantRoom;
  boardingHouseId: string;
};

type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "INACTIVE";

const ITEMS_PER_PAGE = 6;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Inactive", value: "INACTIVE" },
];

function formatMoveIn(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

interface TenantsClientProps {
  tenants: Tenant[];
  boardingHouseName: string;
}

export default function TenantsClient({ tenants, boardingHouseName }: TenantsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(
    () => [
      {
        label: "Total Tenants",
        value: tenants.length,
        icon: Users,
        bgColor: "bg-secondary-container",
        iconColor: "text-secondary",
      },
      {
        label: "Active",
        value: tenants.filter((t) => t.status === "ACTIVE").length,
        icon: Users,
        bgColor: "bg-success-container",
        iconColor: "text-success",
      },
      {
        label: "Pending",
        value: tenants.filter((t) => t.status === "PENDING").length,
        icon: Users,
        bgColor: "bg-secondary-container",
        iconColor: "text-secondary",
      },
      {
        label: "Inactive",
        value: tenants.filter((t) => t.status === "INACTIVE").length,
        icon: Users,
        bgColor: "bg-error-container",
        iconColor: "text-error",
      },
    ],
    [tenants]
  );

  const filteredTenants = useMemo(() => {
    let result = tenants;

    if (activeFilter !== "ALL") {
      result = result.filter((t) => t.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.email && t.email.toLowerCase().includes(q)) ||
          t.phone.includes(q) ||
          (t.room && t.room.number.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tenants, searchQuery, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTenants = filteredTenants.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  function handleFilterChange(filter: StatusFilter) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-on-surface md:text-3xl">
            Tenant Directory
          </h1>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Manage and view all tenant information
          </p>
        </div>
        <button className="gradient-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-[family-name:var(--font-body)] text-sm font-semibold text-white shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] transition-shadow duration-200 hover:shadow-[0_20px_40px_-8px_rgba(24,28,30,0.08)]">
          <UserPlus className="h-4 w-4" />
          Add Tenant
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold text-on-surface">
                  {stat.value}
                </p>
                <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search by name, email, phone, or room number..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-xl bg-surface-container py-3.5 pl-12 pr-4 font-[family-name:var(--font-body)] text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors duration-200 focus:bg-surface-container-low"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={`rounded-full px-4 py-2 font-[family-name:var(--font-body)] text-sm font-medium transition-colors duration-200 ${
              activeFilter === filter.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-4 text-left font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Tenant
              </th>
              <th className="px-6 py-4 text-left font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Contact
              </th>
              <th className="px-6 py-4 text-left font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Room
              </th>
              <th className="px-6 py-4 text-left font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-4 text-left font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Move-in
              </th>
              <th className="px-6 py-4 text-left font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Rent
              </th>
              <th className="px-6 py-4 text-right font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTenants.map((tenant) => (
              <tr
                key={tenant.id}
                className="transition-colors duration-200 hover:bg-surface-container-low"
              >
                {/* Tenant */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                      <span className="font-[family-name:var(--font-display)] text-sm font-bold text-primary">
                        {getInitials(tenant.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-body)] text-sm font-semibold text-on-surface">
                        {tenant.name}
                      </p>
                      <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                        {boardingHouseName}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Contact */}
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1.5 font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                      <Mail className="h-3.5 w-3.5" />
                      {tenant.email || "No email"}
                    </p>
                    <p className="flex items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                      <Phone className="h-3 w-3" />
                      {tenant.phone}
                    </p>
                  </div>
                </td>
                {/* Room */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-on-surface-variant" />
                    <span className="font-[family-name:var(--font-body)] text-sm font-medium text-on-surface">
                      {tenant.room ? `Room ${tenant.room.number}` : "Unassigned"}
                    </span>
                  </div>
                </td>
                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 font-[family-name:var(--font-body)] text-xs font-semibold ${getStatusColor(tenant.status)}`}
                  >
                    {tenant.status}
                  </span>
                </td>
                {/* Move-in */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-on-surface-variant" />
                    <span className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
                      {formatMoveIn(tenant.moveInDate)}
                    </span>
                  </div>
                </td>
                {/* Rent */}
                <td className="px-6 py-4">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                    {tenant.room ? formatCurrency(tenant.room.monthlyRate) : "--"}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
                      title="View tenant"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
                      title="Edit tenant"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
                      title="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedTenants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <Users className="mx-auto h-10 w-10 text-on-surface-variant opacity-40" />
                  <p className="mt-3 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant">
                    No tenants found
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                    Try adjusting your search or filter criteria
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (Mobile) */}
      <div className="space-y-3 md:hidden">
        {paginatedTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="rounded-2xl bg-surface-container-lowest p-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]"
          >
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-primary">
                    {getInitials(tenant.name)}
                  </span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-body)] text-sm font-semibold text-on-surface">
                    {tenant.name}
                  </p>
                  <p className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                    {boardingHouseName}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-[family-name:var(--font-body)] text-xs font-semibold ${getStatusColor(tenant.status)}`}
              >
                {tenant.status}
              </span>
            </div>

            {/* Card details */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="truncate font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  {tenant.email || "No email"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  {tenant.phone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="font-[family-name:var(--font-body)] text-xs font-medium text-on-surface">
                  {tenant.room ? `Room ${tenant.room.number}` : "Unassigned"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
                  {formatMoveIn(tenant.moveInDate)}
                </span>
              </div>
            </div>

            {/* Card footer */}
            <div className="mt-4 flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-sm font-bold text-on-surface">
                {tenant.room ? formatCurrency(tenant.room.monthlyRate) : "No room"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
                  title="View tenant"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
                  title="Edit tenant"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {paginatedTenants.length === 0 && (
          <div className="rounded-2xl bg-surface-container-lowest px-6 py-16 text-center shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
            <Users className="mx-auto h-10 w-10 text-on-surface-variant opacity-40" />
            <p className="mt-3 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant">
              No tenants found
            </p>
            <p className="mt-1 font-[family-name:var(--font-body)] text-xs text-on-surface-variant">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTenants.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between rounded-2xl bg-surface-container-lowest px-6 py-4 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
          <p className="font-[family-name:var(--font-body)] text-sm text-on-surface-variant">
            Showing{" "}
            <span className="font-semibold text-on-surface">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-on-surface">
              {Math.min(safePage * ITEMS_PER_PAGE, filteredTenants.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-on-surface">
              {filteredTenants.length}
            </span>{" "}
            tenants
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl font-[family-name:var(--font-body)] text-sm font-medium transition-colors duration-200 ${
                  page === safePage
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {page}
              </button>
            ))}

            <span className="sm:hidden font-[family-name:var(--font-body)] text-sm text-on-surface-variant px-2">
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-[family-name:var(--font-body)] text-sm font-medium text-on-surface-variant transition-colors duration-200 hover:bg-surface-container disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
