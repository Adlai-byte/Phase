"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Bell,
  CreditCard,
  Shield,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  ChevronRight,
  Check,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

type Subscription = {
  plan: string;
  maxRooms: number;
  maxTenants: number;
  emailSms: boolean;
  analytics: boolean;
  amount: number;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  verified: boolean;
  subscription: Subscription | null;
};

interface SettingsClientProps {
  user: UserData;
}

function planLabel(plan: string): string {
  switch (plan) {
    case "STARTER":
      return "Starter";
    case "PROFESSIONAL":
      return "Professional";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return plan;
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "subscription", label: "Subscription", icon: CreditCard },
    { key: "security", label: "Security", icon: Shield },
  ];

  const subscription = user.subscription;

  const planFeatures: string[] = subscription
    ? [
        `Up to ${subscription.maxRooms} rooms`,
        `Up to ${subscription.maxTenants} tenants`,
        ...(subscription.emailSms ? ["Email & SMS invoicing"] : []),
        ...(subscription.analytics ? ["Data analytics"] : []),
        "Priority support",
        "Custom branding",
      ]
    : ["Up to 10 rooms", "Up to 15 tenants"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface">
          Settings
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary-fixed text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                <ChevronRight size={14} className="ml-auto opacity-40" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low">
                <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface">
                  Profile Information
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Update your personal details
                </p>
              </div>
              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center relative group">
                    <span className="text-xl font-bold text-primary">
                      {getInitials(user.name)}
                    </span>
                    <div className="absolute inset-0 bg-primary/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {user.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {user.role === "SUPERADMIN" ? "Administrator" : "Owner"}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                      />
                      <input
                        type="text"
                        defaultValue={user.name}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                      />
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                      />
                      <input
                        type="tel"
                        defaultValue={user.phone || ""}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => alert("Profile updated (demo)")} className="gradient-primary text-on-primary px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low">
                <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface">
                  Notification Preferences
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Payment received", desc: "When a tenant pays an invoice", enabled: true },
                  { label: "Invoice overdue", desc: "When an invoice passes its due date", enabled: true },
                  { label: "New tenant application", desc: "When someone applies for a room", enabled: true },
                  { label: "Maintenance requests", desc: "When a tenant reports an issue", enabled: false },
                  { label: "Monthly reports", desc: "Revenue and occupancy summaries", enabled: true },
                ].map((pref) => (
                  <div
                    key={pref.label}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {pref.label}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {pref.desc}
                      </p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        pref.enabled ? "bg-primary" : "bg-surface-container-high"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                          pref.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low">
                <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface">
                  Current Plan
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between p-5 bg-primary-fixed/30 rounded-2xl mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
                      {subscription ? planLabel(subscription.plan) : "Free"}
                    </span>
                    <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-on-surface mt-2">
                      {subscription ? formatAmount(subscription.amount) : formatAmount(0)}
                      <span className="text-sm font-normal text-on-surface-variant">
                        /month
                      </span>
                    </p>
                  </div>
                  <button onClick={() => alert("Plan upgrade coming soon")} className="px-5 py-2.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                    Change Plan
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {planFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-on-surface"
                    >
                      <div className="w-5 h-5 rounded-full bg-success-container flex items-center justify-center">
                        <Check size={12} className="text-success" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low">
                <h2 className="text-base font-semibold font-[family-name:var(--font-display)] text-on-surface">
                  Security Settings
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface mb-3">
                    Change Password
                  </h3>
                  <div className="space-y-3 max-w-md">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button onClick={() => alert("Password updated (demo)")} className="gradient-primary text-on-primary px-5 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity">
                      Update Password
                    </button>
                  </div>
                </div>
                <div className="pt-4">
                  <h3 className="text-sm font-semibold text-on-surface mb-1">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <button onClick={() => alert("2FA setup coming soon")} className="px-5 py-2.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
