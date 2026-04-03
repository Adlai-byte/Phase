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
  User,
  Phone,
} from "lucide-react";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await registerAction(formData);
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
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-white/[0.03]" />

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
              Start managing your properties today
            </h1>
            <p className="text-white/70 text-lg font-[family-name:var(--font-body)] max-w-md">
              Join boarding house owners across Mati City who trust Phase to
              streamline their operations.
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                icon: Building2,
                title: "Quick Setup",
                desc: "List your boarding house in under 5 minutes",
              },
              {
                icon: Users,
                title: "Grow Your Business",
                desc: "Reach more tenants with verified listings",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                desc: "Enterprise-grade security for your data",
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

      {/* Right Side - Register Form */}
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
              Create your account
            </h2>
            <p className="text-on-surface-variant font-[family-name:var(--font-body)]">
              Get started with Phase in just a few steps
            </p>
          </div>

          {state?.error && (
            <div className="p-3 rounded-xl bg-error-container text-error text-sm font-[family-name:var(--font-body)]">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-on-surface font-[family-name:var(--font-body)]"
              >
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                <input
                  id="fullName"
                  name="name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 font-[family-name:var(--font-body)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                  required
                />
              </div>
            </div>

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

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-on-surface font-[family-name:var(--font-body)]"
              >
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0917-123-4567"
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
                  placeholder="Create a strong password"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-on-surface font-[family-name:var(--font-body)]"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/60" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="w-full pl-11 pr-12 py-3 rounded-2xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 font-[family-name:var(--font-body)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-md accent-primary mt-0.5"
                  required
                />
                <span className="text-sm text-on-surface-variant font-[family-name:var(--font-body)] leading-snug">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-primary font-medium hover:text-primary-container transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary font-medium hover:text-primary-container transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full gradient-primary text-on-primary py-3 rounded-full font-semibold text-sm font-[family-name:var(--font-display)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_10px_30px_-5px_rgba(24,28,30,0.04)] mt-2 disabled:opacity-60"
            >
              {isPending ? "Creating account..." : "Create account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-on-surface-variant font-[family-name:var(--font-body)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:text-primary-container transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
