// Tests run against an embedded local Postgres started by vitest.globalSetup.ts.
// We hardcode the connection details so each worker process can connect
// without needing vitest's inject/provide cross-worker channel.
const TEST_DATABASE_URL =
  "postgresql://postgres:test@localhost:54329/phase_test?schema=public";

// Set environment variables at module scope so they are available
// during module initialization (e.g., Prisma client created at import time).
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.POSTGRES_PRISMA_URL = TEST_DATABASE_URL;
process.env.POSTGRES_URL_NON_POOLING = TEST_DATABASE_URL;
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
