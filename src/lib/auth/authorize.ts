import type { SessionPayload } from "./session";

type AuthResult =
  | { allowed: true }
  | { allowed: false; redirect: string };

const PUBLIC_ROUTES = ["/", "/find"];
const AUTH_ROUTES = ["/login", "/register"];

export function authorizeRoute(
  pathname: string,
  user: SessionPayload | null
): AuthResult {
  // Auth pages: redirect logged-in users away
  if (AUTH_ROUTES.some((r) => pathname === r)) {
    if (user) {
      const dest = user.role === "SUPERADMIN" ? "/admin" : "/dashboard";
      return { allowed: false, redirect: dest };
    }
    return { allowed: true };
  }

  // Public routes: always accessible
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "?"))) {
    return { allowed: true };
  }

  // Protected routes: require auth
  if (!user) {
    return { allowed: false, redirect: "/login" };
  }

  // Admin routes: SUPERADMIN only
  if (pathname.startsWith("/admin")) {
    if (user.role !== "SUPERADMIN") {
      return { allowed: false, redirect: "/dashboard" };
    }
    return { allowed: true };
  }

  // Dashboard routes: any authenticated user
  if (pathname.startsWith("/dashboard")) {
    return { allowed: true };
  }

  return { allowed: true };
}
