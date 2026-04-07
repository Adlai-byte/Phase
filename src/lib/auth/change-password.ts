import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "./password";

const newPasswordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    return { success: false as const, error: "Incorrect current password" };
  }

  const parsed = newPasswordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { success: true as const };
}
