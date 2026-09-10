import "../src/load-env";
import postgres from "postgres";
import { spawnSync } from "node:child_process";
import path from "node:path";

// A unique 64-bit integer ID for PMG Tracker schema migrations
const MIGRATION_LOCK_ID = 83729104;

async function runMigrateWithLock() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const isLocal =
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1") ||
    dbUrl.includes("sslmode=disable");

  const sql = postgres(dbUrl, {
    max: 1,
    ssl: isLocal ? false : "require",
    connect_timeout: 15,
  });

  console.log("🔒 Acquiring PostgreSQL migration advisory lock...");
  try {
    await sql.unsafe(`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID});`);
    console.log("🔓 Lock acquired. Running migrations via drizzle-kit...");

    const pkgDbDir = path.resolve(__dirname, "..");
    const result = spawnSync("bun", ["x", "drizzle-kit", "migrate"], {
      cwd: pkgDbDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    if (result.status !== 0) {
      throw new Error(`drizzle-kit migrate failed with exit code ${result.status ?? 1}`);
    }
    console.log("✅ Migrations applied successfully.");
  } finally {
    try {
      console.log("🔓 Releasing PostgreSQL migration advisory lock...");
      await sql.unsafe(`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID});`);
    } catch (unlockErr) {
      console.warn("⚠️ Warning: Failed to explicitly release advisory lock:", unlockErr);
    } finally {
      await sql.end();
    }
  }
}

runMigrateWithLock().catch((err) => {
  console.error("❌ Migration error:", err.message || err);
  process.exit(1);
});
