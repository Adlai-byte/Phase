import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { loginUser } from "./login";
import { registerUser } from "./register";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

describe("loginUser", () => {
  beforeEach(async () => {
    await cleanupTestDb();
    // Seed a test user
    await registerUser({
      name: "Elena Magsaysay",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "securePass123",
    });
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("returns user for correct credentials", async () => {
    const result = await loginUser({
      email: "elena@example.com",
      password: "securePass123",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe("elena@example.com");
    expect(result.user!.name).toBe("Elena Magsaysay");
    expect(result.user!.role).toBe("OWNER");
  });

  it("never returns password hash in user object", async () => {
    const result = await loginUser({
      email: "elena@example.com",
      password: "securePass123",
    });

    expect(result.success).toBe(true);
    expect((result.user as any).password).toBeUndefined();
  });

  it("rejects non-existent email", async () => {
    const result = await loginUser({
      email: "nobody@example.com",
      password: "securePass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid");
  });

  it("rejects wrong password", async () => {
    const result = await loginUser({
      email: "elena@example.com",
      password: "wrongPassword",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid");
  });

  it("rejects empty email", async () => {
    const result = await loginUser({
      email: "",
      password: "securePass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects empty password", async () => {
    const result = await loginUser({
      email: "elena@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns user id for session creation", async () => {
    const result = await loginUser({
      email: "elena@example.com",
      password: "securePass123",
    });

    expect(result.user!.id).toBeDefined();
    expect(typeof result.user!.id).toBe("string");
    expect(result.user!.id.length).toBeGreaterThan(0);
  });
});
