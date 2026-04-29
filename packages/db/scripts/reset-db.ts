/**
 * reset-db.ts
 * Drops all tables and enums in the public schema, then exits.
 * Run with: bun scripts/reset-db.ts
 * ⚠️  This is destructive — only use in development.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sql = neon(url);

async function reset() {
  console.log("⚠️  Dropping all tables and enums in public schema...");

  // Drop all tables in dependency order (or use CASCADE)
  await sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `;

  // Drop all enums
  await sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT typname FROM pg_type
        JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        WHERE pg_namespace.nspname = 'public' AND pg_type.typtype = 'e'
      ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$;
  `;

  console.log("✅ Database reset complete. Run `bun run push` to re-apply schema.");
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
