/**
 * Vitest global setup — starts an embedded Postgres server for tests.
 *
 * Lifecycle:
 *   1. Initialise a local postgres cluster in .tmp/test-pg (one-time)
 *   2. Start the server on TEST_PG_PORT
 *   3. Create the test database
 *   4. Push the Prisma schema to it
 *   5. On teardown, stop the server
 *
 * The DATABASE_URL is hardcoded so test workers can connect without
 * needing inject/provide gymnastics. Each test worker imports
 * `src/test/setup.ts` which sets the same URL.
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "child_process";
import path from "path";
import { existsSync, rmSync } from "fs";

const TEST_PG_PORT = 54329;
const TEST_PG_USER = "postgres";
const TEST_PG_PASSWORD = "test";
const TEST_PG_DB = "phase_test";
const DATA_DIR = path.resolve(process.cwd(), ".tmp/test-pg");

const TEST_DATABASE_URL = `postgresql://${TEST_PG_USER}:${TEST_PG_PASSWORD}@localhost:${TEST_PG_PORT}/${TEST_PG_DB}?schema=public`;

let pg: EmbeddedPostgres | null = null;

export async function setup() {
  // Fresh cluster each run for predictable state.
  // Cluster init takes ~6s but server start is fast (~400ms).
  if (existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
  }

  pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: TEST_PG_USER,
    password: TEST_PG_PASSWORD,
    port: TEST_PG_PORT,
    persistent: false,
    // Force UTF-8 encoding so we can store unicode characters like ₱ (peso sign).
    // The default uses the host locale which on Windows is WIN1252 and rejects
    // many unicode characters.
    initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-collate=C", "--lc-ctype=C"],
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase(TEST_PG_DB);

  // Push the Prisma schema to the test database
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: {
      ...process.env,
      POSTGRES_PRISMA_URL: TEST_DATABASE_URL,
      POSTGRES_URL_NON_POOLING: TEST_DATABASE_URL,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  });
}

export async function teardown() {
  if (pg) {
    await pg.stop();
    pg = null;
  }
}
