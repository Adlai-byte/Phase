import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

describe("Rate Limiting", () => {
  const key = "test:rate-limit:" + Math.random();

  beforeEach(async () => {
    await resetRateLimit(key);
  });

  it("allows first attempt", async () => {
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(true);
  });

  it("allows up to 5 attempts", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(key);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks 6th attempt", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeDefined();
    expect(result.retryAfterMs!).toBeGreaterThan(0);
  });

  it("continues blocking after limit reached", async () => {
    for (let i = 0; i < 7; i++) {
      await checkRateLimit(key);
    }
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(false);
  });

  it("resets after calling resetRateLimit", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    expect((await checkRateLimit(key)).allowed).toBe(false);

    await resetRateLimit(key);
    expect((await checkRateLimit(key)).allowed).toBe(true);
  });

  it("tracks different keys independently", async () => {
    const keyA = "test:a:" + Math.random();
    const keyB = "test:b:" + Math.random();

    for (let i = 0; i < 5; i++) {
      await checkRateLimit(keyA);
    }
    expect((await checkRateLimit(keyA)).allowed).toBe(false);
    expect((await checkRateLimit(keyB)).allowed).toBe(true);

    // Cleanup
    await resetRateLimit(keyA);
    await resetRateLimit(keyB);
  });

  it("returns retryAfterMs in milliseconds", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    const result = await checkRateLimit(key);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs!).toBeLessThanOrEqual(15 * 60 * 1000);
  });
});
