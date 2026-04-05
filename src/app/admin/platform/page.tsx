"use client";

import { useState } from "react";
import { Settings, ToggleLeft, ToggleRight, Shield, Server, Bell } from "lucide-react";

export default function AdminPlatformPage() {
  const [signups, setSignups] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  const controls = [
    {
      label: "New Sign-ups",
      description: "Allow new owners to register on the platform",
      icon: Shield,
      enabled: signups,
      toggle: () => setSignups(!signups),
    },
    {
      label: "Maintenance Mode",
      description: "Temporarily disable the platform for maintenance",
      icon: Server,
      enabled: maintenance,
      toggle: () => setMaintenance(!maintenance),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Platform Settings
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage global platform configuration
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
        <div className="px-6 py-4 bg-surface-container-low">
          <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface flex items-center gap-2">
            <Settings size={18} /> Platform Controls
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {controls.map((ctrl) => (
            <div key={ctrl.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                  <ctrl.icon size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{ctrl.label}</p>
                  <p className="text-xs text-on-surface-variant">{ctrl.description}</p>
                </div>
              </div>
              <button
                onClick={ctrl.toggle}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  ctrl.enabled ? "bg-primary" : "bg-surface-container-high"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                    ctrl.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)]">
        <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface mb-4">
          System Information
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Version", value: "1.0.0" },
            { label: "Database", value: "SQLite (Development)" },
            { label: "Framework", value: "Next.js 15.5" },
            { label: "Environment", value: "Development" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm py-2">
              <span className="text-on-surface-variant">{item.label}</span>
              <span className="font-medium text-on-surface">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
