import * as fs from "fs";
import * as path from "path";

async function checkMigrationSafety() {
  console.log("\n🛡️ Running Migration Safety & Anti-Data-Loss Linter...\n");

  const migrationsDir = path.resolve(__dirname, "../migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

  let violations = 0;

  const dangerousPatterns = [
    { pattern: /DROP\s+TABLE(?!\s+IF\s+EXISTS)/i, name: "Unsafe DROP TABLE without IF EXISTS" },
    { pattern: /TRUNCATE\s+TABLE/i, name: "TRUNCATE TABLE detected" },
  ];

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, lineIdx) => {
      // Ignore comments
      if (line.trim().startsWith("--")) return;

      for (const check of dangerousPatterns) {
        if (check.pattern.test(line)) {
          console.error(`❌ [${file}:${lineIdx + 1}] Dangerous DDL: ${check.name}`);
          console.error(`   Line: "${line.trim()}"`);
          violations++;
        }
      }
    });
  }

  if (violations > 0) {
    console.error(`\n🚨 Found ${violations} unsafe migration statement(s)!`);
    console.error("Migrations must use safe idempotent clauses and must not drop live data.\n");
    process.exit(1);
  }

  console.log(`✅ All ${files.length} migration files passed safety checks (No unsafe DROP/TRUNCATE).\n`);
}

checkMigrationSafety().catch((err) => {
  console.error("Safety check failure:", err);
  process.exit(1);
});
