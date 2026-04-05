export const ROOM_TYPES = [
  { value: "BEDSPACER", label: "Bedspacer", description: "Shared room with bed space" },
  { value: "SOLO_ROOM", label: "Solo Room", description: "Private room for one person" },
  { value: "DUAL_BED", label: "Dual Bed", description: "Room with two beds" },
  { value: "APARTMENT", label: "Apartment", description: "Self-contained unit with kitchen" },
  { value: "STUDIO", label: "Studio", description: "Open-plan living and sleeping area" },
  { value: "FAMILY_ROOM", label: "Family Room", description: "Large room for families" },
] as const;

export type RoomType = (typeof ROOM_TYPES)[number]["value"];

export function getRoomTypeLabel(type: string): string {
  return ROOM_TYPES.find((t) => t.value === type)?.label || type;
}

export function getRoomTypeBadgeColor(type: string): string {
  switch (type) {
    case "BEDSPACER": return "bg-secondary-container text-secondary";
    case "SOLO_ROOM": return "bg-primary-fixed text-primary";
    case "DUAL_BED": return "bg-tertiary-fixed text-tertiary";
    case "APARTMENT": return "bg-success-container text-success";
    case "STUDIO": return "bg-pink-100 text-pink-700";
    case "FAMILY_ROOM": return "bg-sky-100 text-sky-700";
    default: return "bg-surface-container-high text-on-surface-variant";
  }
}
