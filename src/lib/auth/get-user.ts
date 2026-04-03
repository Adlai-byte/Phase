import { cookies } from "next/headers";
import { verifyToken, type SessionPayload } from "./session";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("phase-session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUserWithDetails() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      verified: true,
      subscription: true,
      boardingHouses: {
        select: { id: true, name: true },
        take: 1,
      },
    },
  });

  return user;
}
