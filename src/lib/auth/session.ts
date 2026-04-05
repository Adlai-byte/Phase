import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const key = process.env.JWT_SECRET;
  if (!key) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(key);
}

const secret = getSecret();

export type SessionPayload = {
  id: string;
  email: string;
  role: string;
  name: string;
};

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    // Validate payload shape before casting
    if (
      typeof payload.id === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}
