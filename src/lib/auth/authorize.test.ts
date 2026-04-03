import { describe, it, expect } from "vitest";
import { authorizeRoute } from "./authorize";

describe("authorizeRoute", () => {
  // ── Public routes ─────────────────────────────
  it("allows public routes without auth", () => {
    expect(authorizeRoute("/", null).allowed).toBe(true);
  });

  it("allows /find without auth", () => {
    expect(authorizeRoute("/find", null).allowed).toBe(true);
  });

  it("allows /login without auth", () => {
    expect(authorizeRoute("/login", null).allowed).toBe(true);
  });

  it("allows /register without auth", () => {
    expect(authorizeRoute("/register", null).allowed).toBe(true);
  });

  // ── Unauthenticated redirects ─────────────────
  it("redirects unauthenticated from /dashboard to /login", () => {
    const result = authorizeRoute("/dashboard", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  it("redirects unauthenticated from /dashboard/tenants to /login", () => {
    const result = authorizeRoute("/dashboard/tenants", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  it("redirects unauthenticated from /dashboard/invoices to /login", () => {
    const result = authorizeRoute("/dashboard/invoices", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  it("redirects unauthenticated from /dashboard/properties to /login", () => {
    const result = authorizeRoute("/dashboard/properties", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  it("redirects unauthenticated from /admin to /login", () => {
    const result = authorizeRoute("/admin", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  it("redirects unauthenticated from /admin/owners to /login", () => {
    const result = authorizeRoute("/admin/owners", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  it("redirects unauthenticated from /admin/analytics to /login", () => {
    const result = authorizeRoute("/admin/analytics", null);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/login");
  });

  // ── OWNER access ──────────────────────────────
  const owner = { id: "1", email: "a@b.com", role: "OWNER", name: "A" };

  it("allows OWNER to access /dashboard", () => {
    expect(authorizeRoute("/dashboard", owner).allowed).toBe(true);
  });

  it("allows OWNER to access /dashboard/billing", () => {
    expect(authorizeRoute("/dashboard/billing", owner).allowed).toBe(true);
  });

  it("allows OWNER to access /dashboard/transfers", () => {
    expect(authorizeRoute("/dashboard/transfers", owner).allowed).toBe(true);
  });

  it("allows OWNER to access /dashboard/settings", () => {
    expect(authorizeRoute("/dashboard/settings", owner).allowed).toBe(true);
  });

  it("blocks OWNER from /admin", () => {
    const result = authorizeRoute("/admin", owner);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/dashboard");
  });

  it("blocks OWNER from /admin/owners", () => {
    const result = authorizeRoute("/admin/owners", owner);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/dashboard");
  });

  it("blocks OWNER from /admin/analytics", () => {
    const result = authorizeRoute("/admin/analytics", owner);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/dashboard");
  });

  // ── SUPERADMIN access ─────────────────────────
  const admin = { id: "1", email: "a@b.com", role: "SUPERADMIN", name: "A" };

  it("allows SUPERADMIN to access /admin", () => {
    expect(authorizeRoute("/admin", admin).allowed).toBe(true);
  });

  it("allows SUPERADMIN to access /admin/analytics", () => {
    expect(authorizeRoute("/admin/analytics", admin).allowed).toBe(true);
  });

  it("allows SUPERADMIN to access /admin/owners", () => {
    expect(authorizeRoute("/admin/owners", admin).allowed).toBe(true);
  });

  it("allows SUPERADMIN to access /dashboard too", () => {
    expect(authorizeRoute("/dashboard", admin).allowed).toBe(true);
  });

  // ── Logged-in redirect from auth pages ────────
  it("redirects logged-in OWNER from /login to /dashboard", () => {
    const result = authorizeRoute("/login", owner);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/dashboard");
  });

  it("redirects logged-in OWNER from /register to /dashboard", () => {
    const result = authorizeRoute("/register", owner);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/dashboard");
  });

  it("redirects logged-in SUPERADMIN from /login to /admin", () => {
    const result = authorizeRoute("/login", admin);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/admin");
  });

  it("redirects logged-in SUPERADMIN from /register to /admin", () => {
    const result = authorizeRoute("/register", admin);
    expect(result.allowed).toBe(false);
    expect(result).toHaveProperty("redirect", "/admin");
  });
});
