import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "./password";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

type LoginResult = {
  success: boolean;
  user?: { id: string; email: string; name: string; role: string };
  error?: string;
};

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
