import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/session";
import { authorizeRoute } from "@/lib/auth/authorize";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("phase-session")?.value;
  const user = token ? await verifyToken(token) : null;

  const result = authorizeRoute(request.nextUrl.pathname, user);

  if (!result.allowed) {
    const url = request.nextUrl.clone();
    url.pathname = result.redirect;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
