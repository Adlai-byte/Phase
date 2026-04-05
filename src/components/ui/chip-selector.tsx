"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type ChipSelectorProps = {
  label: string;
  name: string;
  options: string[];
  defaultSelected?: string[];
};

export function ChipSelector({ label, name, options, defaultSelected = [] }: ChipSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(option: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }

  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-2">
        {label}
      </label>
      <input type="hidden" name={name} value={Array.from(selected).join(",")} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {isSelected && <Check size={12} />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const AMENITY_OPTIONS = [
  "WiFi",
  "CCTV",
  "Kitchen",
  "Laundry",
  "Study Area",
  "Parking",
  "Air Conditioning",
  "Gym",
  "Garden",
  "Water Included",
  "Balcony",
  "Common Area",
  "Elevator",
  "Security Guard",
];

export const RESTRICTION_OPTIONS = [
  "No Pets",
  "No Smoking",
  "No Visitors After 9PM",
  "Quiet Hours 10PM-6AM",
  "No Overnight Guests",
  "No Cooking in Rooms",
  "No Loud Music",
  "ID Required for Visitors",
];

export const ROOM_AMENITY_OPTIONS = [
  "Air Conditioning",
  "WiFi",
  "Private Bathroom",
  "Electricity Included",
  "Balcony",
  "Study Desk",
  "Closet",
  "Water Heater",
];
