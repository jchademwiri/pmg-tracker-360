import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";

const envPath = path.resolve(process.cwd(), "../../.env.local");
if (fs.existsSync(envPath)) config({ path: envPath });
else config({ path: path.resolve(process.cwd(), ".env.local") });

async function debugMigrate() {
  const dbUrl = process.env.DATABASE_URL!;
  const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes("sslmode=disable");
  const sql = postgres(dbUrl, { max: 1, ssl: isLocal ? false : "require" });

  try {
    const applied = await sql<{ id: number; hash: string }[]>`
      SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id ASC;
    `;
    console.log("Currently applied in DB:", applied);

    const journalPath = path.resolve(__dirname, "../migrations/meta/_journal.json");
    const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
    
    for (let i = applied.length; i < journal.entries.length; i++) {
      const entry = journal.entries[i];
      const sqlFile = path.resolve(__dirname, `../migrations/${entry.tag}.sql`);
      console.log(`\nTesting migration ${entry.tag}.sql (idx: ${entry.idx})...`);
      const sqlContent = fs.readFileSync(sqlFile, "utf-8");
      
      const statements = sqlContent.split("--> statement-breakpoint");
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;
        try {
          await sql.unsafe(trimmed);
          console.log(`  ✓ Statement succeeded: ${trimmed.slice(0, 50)}...`);
        } catch (err: any) {
          console.error(`  ❌ Statement failed: ${trimmed}`);
          console.error(`  Error message: ${err.message} (Code: ${err.code})`);
          await sql.end();
          return;
        }
      }
    }
  } finally {
    await sql.end();
  }
}

debugMigrate().catch(console.error);
