import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let userId: string;

beforeEach(async () => {
  await cleanupTestDb();
  const hash = await hashPassword("OldPass123");
  const user = await prisma.user.create({
    data: { name: "Test", email: "test@pw.com", password: hash, role: "OWNER" },
  });
  userId = user.id;
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("changePassword", () => {
  it("changes password when current password is correct", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "NewPass456");
    expect(result.success).toBe(true);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(await verifyPassword("NewPass456", user!.password)).toBe(true);
  });

  it("rejects wrong current password", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "WrongPass1", "NewPass456");
    expect(result.success).toBe(false);
    expect(result.error).toContain("current password");
  });

  it("rejects new password that is too short", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "Sh1");
    expect(result.success).toBe(false);
  });

  it("rejects new password without uppercase", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "newpass123");
    expect(result.success).toBe(false);
  });

  it("rejects new password without number", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "NewPassNoNum");
    expect(result.success).toBe(false);
  });

  it("rejects new password over 72 characters", async () => {
    const { changePassword } = await import("./change-password");
    const longPass = "A1" + "a".repeat(71);
    const result = await changePassword(userId, "OldPass123", longPass);
    expect(result.success).toBe(false);
  });
});
