import { describe, it, expect, beforeEach } from "vitest";
import { createToken, verifyToken } from "./session";

describe("createToken", () => {
  it("returns a non-empty JWT string", async () => {
    const token = await createToken({
      id: "user-123",
      email: "test@example.com",
      role: "OWNER",
      name: "Test User",
    });

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    // JWT has 3 parts separated by dots
    expect(token.split(".")).toHaveLength(3);
  });
});

describe("verifyToken", () => {
  it("decodes a valid token and returns the payload", async () => {
    const token = await createToken({
      id: "user-123",
      email: "elena@example.com",
      role: "OWNER",
      name: "Elena",
    });

    const payload = await verifyToken(token);

    expect(payload).not.toBeNull();
    expect(payload!.id).toBe("user-123");
    expect(payload!.email).toBe("elena@example.com");
    expect(payload!.role).toBe("OWNER");
    expect(payload!.name).toBe("Elena");
  });

  it("returns null for an invalid token", async () => {
    const payload = await verifyToken("invalid.token.here");
    expect(payload).toBeNull();
  });

  it("returns null for an empty token", async () => {
    const payload = await verifyToken("");
    expect(payload).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await createToken({
      id: "user-123",
      email: "elena@example.com",
      role: "OWNER",
      name: "Elena",
    });

    // Tamper with the token payload
    const parts = token.split(".");
    parts[1] = parts[1] + "tampered";
    const tampered = parts.join(".");

    const payload = await verifyToken(tampered);
    expect(payload).toBeNull();
  });

  it("preserves role in the payload for authorization", async () => {
    const ownerToken = await createToken({
      id: "owner-1",
      email: "owner@example.com",
      role: "OWNER",
      name: "Owner",
    });
    const adminToken = await createToken({
      id: "admin-1",
      email: "admin@example.com",
      role: "SUPERADMIN",
      name: "Admin",
    });

    const ownerPayload = await verifyToken(ownerToken);
    const adminPayload = await verifyToken(adminToken);

    expect(ownerPayload!.role).toBe("OWNER");
    expect(adminPayload!.role).toBe("SUPERADMIN");
  });
});
