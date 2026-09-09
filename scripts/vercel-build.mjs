/**
 * Shared Vercel build command — migrates the target database, then builds the app.
 *
 * Why this exists
 * ---------------
 * Production must never run code against a schema older than itself. Previously
 * migrations ran via a GitHub Actions workflow (db-migrate.yml) that fired on
 * pushes to dev/master — decoupled from the actual Vercel deploy, so a deploy
 * could go live before/without its migration. This script makes migration a
 * precondition of every production build: migrate -> verify -> build. If any
 * step fails, the deploy aborts and the previous deployment stays live.
 *
 * Environment contract
 * --------------------
 * - VERCEL_ENV=production  -> migrations are applied to DATABASE_URL
 * - anything else          -> migrations are SKIPPED (previews/dev must never
 *                             mutate a shared database)
 * - MIGRATE_ON_DEPLOY=1    -> force migrations outside production (e.g. a
 *                             dedicated staging project)
 * - DATABASE_URL           -> required whenever migrations will run; points at
 *                             the database that serves the deployment
 *
 * Paths are resolved from this file's location, so the script works no matter
 * which directory Vercel uses as the project root.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(scriptDir);

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (result.status !== 0) {
    console.error(
      `[vercel-build] Command failed (exit ${result.status}): ${cmd} ${args.join(" ")}`,
    );
    process.exit(result.status ?? 1);
  }
}

const isProduction = process.env.VERCEL_ENV === "production";
const forced = process.env.MIGRATE_ON_DEPLOY === "1";

if (isProduction || forced) {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[vercel-build] Refusing to deploy: migrations are required for this " +
        "environment but DATABASE_URL is not set. Set it in the Vercel project " +
        "environment variables (it must point at the database this deployment serves).",
    );
    process.exit(1);
  }

  console.log("[vercel-build] Applying database migrations before build...");
  run("bun", ["run", "db:migrate"], { cwd: repoRoot });

  console.log("[vercel-build] Verifying database is in sync...");
  run("bun", ["run", "db:check"], { cwd: repoRoot });
} else {
  console.log(
    "[vercel-build] Non-production deploy: skipping migrations " +
      "(set MIGRATE_ON_DEPLOY=1 on a staging project to enable).",
  );
}

console.log("[vercel-build] Building app...");
run("bun", ["run", "build"]);
