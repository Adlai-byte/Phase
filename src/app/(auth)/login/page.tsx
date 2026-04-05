"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Users,
  Shield,
} from "lucide-react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await loginAction(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative flex-col justify-between p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/[0.03]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white font-[family-name:var(--font-display)]">
              Phase
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white font-[family-name:var(--font-display)] leading-tight mb-4">
              Manage your boarding house with ease
            </h1>
            <p className="text-white/70 text-lg font-[family-name:var(--font-body)] max-w-md">
              The all-in-one platform for boarding house owners and tenants in
              Mati City.
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                icon: Building2,
                title: "Property Management",
                desc: "Track rooms, tenants, and payments in one place",
              },
              {
                icon: Users,
                title: "Tenant Directory",
                desc: "Manage profiles, leases, and communication",
              },
              {
                icon: Shield,
                title: "Verified Listings",
                desc: "Build trust with verified boarding house badges",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <p className="text-white font-medium font-[family-name:var(--font-display)]">
                    {feature.title}
                  </p>
                  <p className="text-white/60 text-sm font-[family-name:var(--font-body)]">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-sm font-[family-name:var(--font-body)]">
            &copy; {new Date().getFullYear()} Phase. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-on-primary" />
            </div>
            <span className="text-2xl font-bold text-on-surface font-[family-name:var(--font-display)]">
              Phase
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-on-surface font-[family-name:var(--font-display)] mb-2">
              Welcome back
            </h2>
            <p className="text-on-surface-variant font-[family-name:var(--font-body)]">
              Sign in to your account to continue
            </p>
          </div>

          {state?.error && (
            <div className="p-3 rounded-xl bg-error-container text-error text-sm font-[family-name:var(--font-body)]">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-on-surface font-[family-name:var(--font-body)]"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 font-[family-name:var(--font-body)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-on-surface font-[family-name:var(--font-body)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3 rounded-2xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 font-[family-name:var(--font-body)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-end">
              <Link
                href="#"
                className="text-sm text-primary font-medium hover:text-primary-container transition-colors font-[family-name:var(--font-body)]"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full gradient-primary text-on-primary py-3 rounded-full font-semibold text-sm font-[family-name:var(--font-display)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] disabled:opacity-60"
            >
              {isPending ? "Signing in..." : "Sign in"}
              {!isPending && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-on-surface-variant font-[family-name:var(--font-body)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:text-primary-container transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
