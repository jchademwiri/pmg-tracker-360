import * as fs from "fs";
import * as path from "path";

const migrationsDir = path.resolve(__dirname, "../migrations");
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql"));

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  // 1. Transform CREATE TYPE
  content = content.replace(/^CREATE TYPE "([^"]+)"\."([^"]+)" AS ENUM\(([^;]+)\);/gm, (match, schema, name, values) => {
    return `DO $$ BEGIN\n  CREATE TYPE "${schema}"."${name}" AS ENUM(${values});\nEXCEPTION\n  WHEN duplicate_object THEN null;\nEND $$;`;
  });

  // 2. Transform ALTER TYPE ADD VALUE to IF NOT EXISTS
  content = content.replace(/ALTER TYPE "([^"]+)"\."([^"]+)" ADD VALUE (?!IF NOT EXISTS )'([^']+)'/g, "ALTER TYPE \"$1\".\"$2\" ADD VALUE IF NOT EXISTS '$3'");
  content = content.replace(/ALTER TYPE "([^"]+)" ADD VALUE (?!IF NOT EXISTS )'([^']+)'/g, "ALTER TYPE \"$1\" ADD VALUE IF NOT EXISTS '$2'");

  // 3. Transform CREATE TABLE
  content = content.replace(/^CREATE TABLE (?!IF NOT EXISTS )"([^"]+)"/gm, 'CREATE TABLE IF NOT EXISTS "$1"');

  // 4. Transform ALTER TABLE ADD CONSTRAINT
  content = content.replace(/^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" ([^;]+);/gm, (match, table, constraint, rest) => {
    return `DO $$ BEGIN\n  ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ${rest};\nEXCEPTION\n  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;\nEND $$;`;
  });

  // 5. Transform ALTER TABLE DROP CONSTRAINT
  content = content.replace(/^ALTER TABLE "([^"]+)" DROP CONSTRAINT (?!IF EXISTS )"([^"]+)";/gm, (match, table, constraint) => {
    return `DO $$ BEGIN\n  ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}";\nEXCEPTION\n  WHEN undefined_object OR undefined_column OR undefined_table THEN null;\nEND $$;`;
  });

  // 6. Transform ALTER TABLE ADD COLUMN
  content = content.replace(/ALTER TABLE "([^"]+)" ADD COLUMN (?!IF NOT EXISTS )"([^"]+)"/g, 'ALTER TABLE "$1" ADD COLUMN IF NOT EXISTS "$2"');

  // 7. Transform ALTER TABLE DROP COLUMN
  content = content.replace(/ALTER TABLE "([^"]+)" DROP COLUMN (?!IF EXISTS )"([^"]+)"/g, 'ALTER TABLE "$1" DROP COLUMN IF EXISTS "$2"');

  // 8. Transform CREATE INDEX
  content = content.replace(/CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS )"([^"]+)"/g, 'CREATE $1INDEX IF NOT EXISTS "$2"');

  // 9. Transform DROP TABLE / DROP INDEX
  content = content.replace(/DROP TABLE (?!IF EXISTS )"([^"]+)"/g, 'DROP TABLE IF EXISTS "$1"');
  content = content.replace(/DROP INDEX (?!IF EXISTS )"([^"]+)"/g, 'DROP INDEX IF EXISTS "$1"');

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`✓ Updated ${file} for idempotency.`);
}
