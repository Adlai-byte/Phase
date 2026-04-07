import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function updateUser(userId: string, input: UpdateUserInput) {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { name, email, phone } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (existing) {
    return { success: false as const, error: "A user with this email already exists" };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, phone: phone || null },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return { success: true as const, user };
}
