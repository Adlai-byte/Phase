"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { registerUser } from "@/lib/auth/register";
import { loginUser } from "@/lib/auth/login";
import { createToken } from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";

async function getClientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("phase-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function registerAction(formData: FormData) {
  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`register:${ip}`);
  if (!rateCheck.allowed) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  const result = await registerUser({ name, email, phone, password });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const token = await createToken(result.user!);
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const ip = await getClientIp();

  const rateCheck = checkRateLimit(`login:${ip}:${email}`);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
    return { success: false, error: `Too many login attempts. Try again in ${minutes} minutes.` };
  }

  const password = formData.get("password") as string;
  const result = await loginUser({ email, password });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Reset rate limit on successful login
  resetRateLimit(`login:${ip}:${email}`);

  const token = await createToken(result.user!);
  await setSessionCookie(token);

  const dest = result.user!.role === "SUPERADMIN" ? "/admin" : "/dashboard";
  redirect(dest);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("phase-session");
  cookieStore.delete("phase-impersonate");
  redirect("/login");
}

export async function impersonateOwner(ownerId: string) {
  const { getCurrentUser } = await import("@/lib/auth/get-user");
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") return { success: false, error: "Not authorized" };

  const { prisma } = await import("@/lib/prisma");
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, email: true, name: true, role: true } });
  if (!owner || owner.role !== "OWNER") return { success: false, error: "Owner not found" };

  const { createToken } = await import("@/lib/auth/session");
  const token = await createToken({ id: owner.id, email: owner.email, name: owner.name, role: owner.role });
  const cookieStore = await cookies();
  // Save admin session for return
  const adminToken = cookieStore.get("phase-session")?.value;
  if (adminToken) {
    cookieStore.set("phase-impersonate", adminToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60, path: "/" });
  }
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("phase-impersonate")?.value;
  if (adminToken) {
    const { verifyToken } = await import("@/lib/auth/session");
    const payload = await verifyToken(adminToken);
    if (!payload || payload.role !== "SUPERADMIN") {
      cookieStore.delete("phase-impersonate");
      redirect("/login");
    }
    cookieStore.set("phase-session", adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    cookieStore.delete("phase-impersonate");
  }
  redirect("/admin");
}
