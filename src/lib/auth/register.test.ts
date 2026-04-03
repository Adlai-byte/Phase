import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { registerUser } from "./register";
import { getTestDb, cleanupTestDb, disconnectTestDb } from "@/test/db";

describe("registerUser", () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("creates a user with valid input", async () => {
    const result = await registerUser({
      name: "Elena Magsaysay",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "securePass123",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe("elena@example.com");
    expect(result.user!.name).toBe("Elena Magsaysay");
    expect(result.user!.role).toBe("OWNER");
    // Should never return the password hash
    expect((result.user as any).password).toBeUndefined();
  });

  it("stores the password as a hash, not plaintext", async () => {
    await registerUser({
      name: "Test User",
      email: "test@example.com",
      phone: "0917-000-0000",
      password: "MyPlaintext1",
    });

    const db = await getTestDb();
    const user = await db.user.findUnique({
      where: { email: "test@example.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.password).not.toBe("MyPlaintext1");
    expect(user!.password.length).toBeGreaterThan(20);
  });

  it("rejects empty name", async () => {
    const result = await registerUser({
      name: "",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "securePass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Name");
  });

  it("rejects invalid email", async () => {
    const result = await registerUser({
      name: "Elena",
      email: "not-an-email",
      phone: "0917-111-2222",
      password: "securePass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("rejects empty email", async () => {
    const result = await registerUser({
      name: "Elena",
      email: "",
      phone: "0917-111-2222",
      password: "securePass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("rejects password shorter than 8 characters", async () => {
    const result = await registerUser({
      name: "Elena",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("password");
  });

  it("rejects password without uppercase letter", async () => {
    const result = await registerUser({
      name: "Elena",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "alllowercase1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("uppercase");
  });

  it("rejects password without number", async () => {
    const result = await registerUser({
      name: "Elena",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "NoNumbersHere",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("number");
  });

  it("rejects duplicate email", async () => {
    await registerUser({
      name: "Elena",
      email: "elena@example.com",
      phone: "0917-111-2222",
      password: "securePass123",
    });

    const result = await registerUser({
      name: "Another Elena",
      email: "elena@example.com",
      phone: "0917-333-4444",
      password: "anotherPass123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("defaults role to OWNER", async () => {
    const result = await registerUser({
      name: "New Owner",
      email: "owner@example.com",
      phone: "0917-111-2222",
      password: "securePass123",
    });

    const db = await getTestDb();
    const user = await db.user.findUnique({
      where: { email: "owner@example.com" },
    });
    expect(user!.role).toBe("OWNER");
    expect(user!.verified).toBe(false);
  });
});
