import { beforeAll } from "vitest";

// Set environment variables at module scope so they are available
// during module initialization (e.g., JWT secret loaded at import time).
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-key-for-testing-only";

beforeAll(() => {
  // Environment variables are set above at module scope.
  // Keep beforeAll for any future per-suite setup needs.
});
