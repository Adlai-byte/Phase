const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (record && now < record.resetAt) {
    if (record.count >= MAX_ATTEMPTS) {
      return { allowed: false, retryAfterMs: record.resetAt - now };
    }
    record.count++;
    return { allowed: true };
  }

  attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  return { allowed: true };
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}

// Cleanup stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts) {
      if (now >= record.resetAt) attempts.delete(key);
    }
  }, 60_000);
}
