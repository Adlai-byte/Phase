import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "./password";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, "Minimum 8 characters for password")
    .max(72, "Password must be 72 characters or fewer")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type RegisterInput = z.infer<typeof registerSchema>;

type RegisterResult = {
  success: boolean;
  user?: { id: string; email: string; name: string; role: string };
  error?: string;
};

export async function registerUser(
  input: RegisterInput
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "A user with this email already exists" };
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: "OWNER",
      verified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return { success: true, user };
}
