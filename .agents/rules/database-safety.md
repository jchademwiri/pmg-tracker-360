# Database Safety & Anti-Data-Loss Rules

## 1. Multi-Environment Database Separation
- **Local Dev & Preview**: Always uses `DATABASE_URL` pointing to the **Dev/Preview database** (`ep-gentle-night-am2xkits`).
- **Production**: Stored strictly in Vercel Production Environment Variables and GitHub Actions secrets (`DATABASE_URL_PRODUCTION`).
- **Production Migrations**: Executed ONLY via GitHub Actions CD workflow on post-merge to `master`/`main`.

## 2. Strict AI Agent Guardrails
- **NEVER Execute Manual DDL on Production**: The AI agent is strictly forbidden from running ad-hoc SQL files, raw `psql` queries, or diagnostic migration scripts directly against the production database connection.
- **Always Test on Dev First**: Any schema generation, migration tests, or seed scripts must run against the Dev database.
- **Never Run Historical Migrations**: Never sequentially re-execute old migration files against an existing database. Use `drizzle-kit migrate` or verify against `__drizzle_migrations`.

## 3. Zero Destructive DDL Policy
- **No Unsafe Drops**: `DROP TABLE` without `IF EXISTS`, `DROP COLUMN` without safe data archiving, and `TRUNCATE TABLE` are strictly prohibited in migration files.
- **Idempotent Migrations**: All migrations must be idempotent:
  - `CREATE TABLE IF NOT EXISTS`
  - `CREATE TYPE` wrapped in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
  - `ALTER TYPE ... ADD VALUE IF NOT EXISTS`
  - `ALTER TABLE ... ADD CONSTRAINT` wrapped in `DO $$ BEGIN ... EXCEPTION WHEN others THEN null; END $$;`
  - `DROP CONSTRAINT IF EXISTS`
  - `CREATE INDEX IF NOT EXISTS`

## 4. Pre-Flight Verification
- Run `bun run db:check` (runs `db:safety` and `db:drift`) before committing any changes.
- Ensure all packages typecheck (`bun run check-types`) and pass linting (`bun run lint`).
