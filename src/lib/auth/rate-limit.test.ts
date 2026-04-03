import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

describe("Rate Limiting", () => {
  const key = "test:rate-limit:" + Math.random();

  beforeEach(() => {
    resetRateLimit(key);
  });

  it("allows first attempt", () => {
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(true);
  });

  it("allows up to 5 attempts", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks 6th attempt", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeDefined();
    expect(result.retryAfterMs!).toBeGreaterThan(0);
  });

  it("continues blocking after limit reached", () => {
    for (let i = 0; i < 7; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(false);
  });

  it("resets after calling resetRateLimit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key).allowed).toBe(false);

    resetRateLimit(key);
    expect(checkRateLimit(key).allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const keyA = "test:a:" + Math.random();
    const keyB = "test:b:" + Math.random();

    for (let i = 0; i < 5; i++) {
      checkRateLimit(keyA);
    }
    expect(checkRateLimit(keyA).allowed).toBe(false);
    expect(checkRateLimit(keyB).allowed).toBe(true);
  });

  it("returns retryAfterMs in milliseconds", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    // Should be around 15 minutes (900000ms)
    expect(result.retryAfterMs!).toBeLessThanOrEqual(15 * 60 * 1000);
  });
});
