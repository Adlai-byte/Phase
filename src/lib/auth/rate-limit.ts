import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const now = new Date();

  const record = await prisma.rateLimit.findUnique({ where: { key } });

  if (record && now < record.resetAt) {
    if (record.count >= MAX_ATTEMPTS) {
      return { allowed: false, retryAfterMs: record.resetAt.getTime() - now.getTime() };
    }
    await prisma.rateLimit.update({
      where: { key },
      data: { count: record.count + 1 },
    });
    return { allowed: true };
  }

  // Create or reset the window
  await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
    update: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
  });
  return { allowed: true };
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}
