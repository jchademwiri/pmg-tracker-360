import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";

// Load environment variables
const envPath = path.resolve(process.cwd(), "../../.env.local");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  const rootEnv = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(rootEnv)) {
    config({ path: rootEnv });
  } else {
    config();
  }
}

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

async function checkDrift() {
  console.log("\n🔍 Checking Database Migration Status & Drift...\n");

  const migrationsDir = path.resolve(__dirname, "../migrations");
  const journalPath = path.join(migrationsDir, "meta/_journal.json");

  if (!fs.existsSync(journalPath)) {
    console.error("❌ Migration journal not found at:", journalPath);
    process.exit(1);
  }

  const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
  const journalEntries = journal.entries;

  console.log(`📁 Found ${journalEntries.length} registered migrations in meta/_journal.json`);

  // Check for orphan SQL files in migrations folder
  const allFiles = fs.readdirSync(migrationsDir);
  const sqlFiles = allFiles.filter((f) => f.endsWith(".sql"));
  const registeredTags = new Set(journalEntries.map((e) => `${e.tag}.sql`));

  const orphanFiles = sqlFiles.filter((f) => !registeredTags.has(f));
  if (orphanFiles.length > 0) {
    console.warn(`⚠️ Warning: Found ${orphanFiles.length} orphan SQL file(s) not tracked in _journal.json:`);
    orphanFiles.forEach((f) => console.warn(`   - ${f}`));
  } else {
    console.log("✅ All SQL migration files are properly registered in _journal.json.");
  }

  // Check against live database if DATABASE_URL is available
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("\nℹ️ DATABASE_URL not set — skipped live database comparison.");
    console.log("   Set DATABASE_URL to check sync state against a live database.\n");
    return;
  }

  // Mask database credentials for safe logging
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
  console.log(`\n📡 Connecting to database: ${maskedUrl}`);

  const isLocalOrTest =
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1") ||
    dbUrl.includes("sslmode=disable");

  const sql = postgres(dbUrl, {
    max: 1,
    ssl: isLocalOrTest ? false : "require",
    connect_timeout: 10,
  });

  try {
    // Check if __drizzle_migrations table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      );
    `;

    const migrationsTableExists = tableCheck[0]?.exists;

    if (!migrationsTableExists) {
      console.warn("⚠️ '__drizzle_migrations' table not found in 'drizzle' schema. Database might be uninitialized.");
      await sql.end();
      return;
    }

    const applied = await sql<{ id: number; hash: string; created_at: number }[]>`
      SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id ASC;
    `;

    console.log(`📊 Applied migrations in DB: ${applied.length}`);
    console.log(`📊 Registered migrations in repo: ${journalEntries.length}`);

    if (applied.length < journalEntries.length) {
      const pending = journalEntries.slice(applied.length);
      console.log(`\n⚠️ Database is BEHIND by ${pending.length} migration(s):`);
      pending.forEach((p) => console.log(`   ⏳ Pending: ${p.tag}.sql (idx: ${p.idx})`));
      console.log(`\n💡 To apply pending migrations, run: bun run db:migrate\n`);
    } else if (applied.length === journalEntries.length) {
      console.log("\n🎉 Database is 100% IN SYNC with repository migrations!\n");
    } else {
      console.warn(`\n⚠️ Database has MORE applied migrations (${applied.length}) than repository (${journalEntries.length}).`);
      console.warn("   This indicates the database was migrated with untracked/divergent migrations.\n");
    }
  } catch (error) {
    console.error("❌ Failed to query database for migration status:", error);
  } finally {
    await sql.end();
  }
}

checkDrift().catch((err) => {
  console.error("Fatal error during drift check:", err);
  process.exit(1);
});
