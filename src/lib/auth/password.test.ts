import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("returns a hashed string different from the input", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash).not.toBe("mypassword123");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("produces different hashes for the same input (salt)", async () => {
    const hash1 = await hashPassword("mypassword123");
    const hash2 = await hashPassword("mypassword123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("correct-password");
    const result = await verifyPassword("correct-password", hash);
    expect(result).toBe(true);
  });

  it("returns false for incorrect password", async () => {
    const hash = await hashPassword("correct-password");
    const result = await verifyPassword("wrong-password", hash);
    expect(result).toBe(false);
  });

  it("returns false for empty password", async () => {
    const hash = await hashPassword("some-password");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
