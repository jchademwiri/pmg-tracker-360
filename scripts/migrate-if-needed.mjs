/**
 * db:migrate delegate with a deploy-safety guard.
 *
 * Why this exists
 * ---------------
 * The Vercel build command is `bun run db:migrate && turbo run build`, and
 * Vercel executes build commands from the project's Root Directory (e.g.
 * apps/admin) — where no db:migrate script exists, since the real one lives
 * at the repo root. The app-level `db:migrate` scripts delegate here.
 *
 * The guard is the whole point: Vercel preview deployments inherit
 * production environment variables, so an unconditional `bun run db:migrate`
 * would let any preview branch mutate the production database. Migrations
 * therefore run only for real production builds (VERCEL_ENV=production) or
 * explicit opt-in (MIGRATE_ON_DEPLOY=1). Everything else exits 0 so the
 * `&&` chain proceeds to the build. A production build without DATABASE_URL
 * refuses to run (fail-closed) rather than deploying against an unmigrated
 * database.
 *
 * Paths are resolved from this file's location, so the app's Root Directory
 * setting does not matter.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(scriptDir);

const isProduction = process.env.VERCEL_ENV === "production";
const forced = process.env.MIGRATE_ON_DEPLOY === "1";

if (!isProduction && !forced) {
  console.log(
    "[migrate] Non-production deploy: skipping migrations " +
      "(previews must never mutate a shared database; " +
      "set MIGRATE_ON_DEPLOY=1 on a dedicated staging project to enable).",
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "[migrate] Refusing to deploy: migrations are required for this " +
      "environment but DATABASE_URL is not set. Set it in the Vercel project " +
      "environment variables (it must point at the database this deployment serves).",
  );
  process.exit(1);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(
      `[migrate] Command failed (exit ${result.status}): ${cmd} ${args.join(" ")}`,
    );
    process.exit(result.status ?? 1);
  }
}

console.log("[migrate] Applying database migrations...");
run("bun", ["run", "db:migrate"]);

console.log("[migrate] Verifying database is in sync...");
run("bun", ["run", "db:check"]);

console.log("[migrate] Database ready.");
