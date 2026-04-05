import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let userId: string;

beforeEach(async () => {
  await cleanupTestDb();
  const hash = await hashPassword("Test123456");
  const user = await prisma.user.create({
    data: { name: "Test User", email: "test@example.com", password: hash, role: "OWNER" },
  });
  userId = user.id;
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("updateUser", () => {
  it("updates name successfully", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "New Name", email: "test@example.com" });
    expect(result.success).toBe(true);
    expect(result.user!.name).toBe("New Name");
  });

  it("updates email successfully", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test User", email: "new@example.com" });
    expect(result.success).toBe(true);
    expect(result.user!.email).toBe("new@example.com");
  });

  it("rejects empty name", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "", email: "test@example.com" });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects invalid email", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate email", async () => {
    const hash = await hashPassword("Test123456");
    await prisma.user.create({
      data: { name: "Other", email: "other@example.com", password: hash, role: "OWNER" },
    });
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test", email: "other@example.com" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("allows keeping the same email", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Updated", email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("updates phone", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test User", email: "test@example.com", phone: "09171234567" });
    expect(result.success).toBe(true);
    expect(result.user!.phone).toBe("09171234567");
  });
});
