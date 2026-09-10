# Walkthrough — `feat/user-roles-hardening` → PR #95

## What shipped

Branch scope: the RBAC/user-roles hardening this branch existed for, backup reliability
fixes, a deploy-time R2 credential health check, and migrate-before-build deployment.
Shipped as seven commits:

| Commit | Scope |
|---|---|
| `75036c2` | Harden organization RBAC and single-owner enforcement (pre-existing) |
| `c6ceec6` | **fix(backup):** stream backups via multipart upload + cron failure alerts |
| `dfd83bf` | **fix(admin):** surface backup storage errors instead of an empty list |
| `3a501c0` | **feat(rbac):** align tracker server queries with soft-delete membership policy |
| `86b7180` | **fix(ci):** mock `requireOrgRole` in crud integration tests (CI self-heal) |
| `ffe4587` | **feat(deploy):** migrate production database before every Vercel build |
| (head) | **feat(admin):** R2 credential health check at startup + `/api/health/r2` |

### Backup reliability (root-caused this session)

**Original complaint:** the daily 22:00 UTC cron backup failed, and no notification
ever arrived.

- `createBackup()` loaded every row of all 29 tables into memory and stringified the
  whole DB in one shot → duration/OOM limits on Vercel as the DB grew. Now streams
  500-row batches through gzip into 8 MB multipart R2 parts; flat memory. Output
  format unchanged — restore untouched.
- No notification path existed at all. The cron route now emails `BACKUP_ALERT_EMAIL`
  via Resend on failure (backup error and alert-send error reported separately).
- `maxDuration = 60` on the cron route (capped for Vercel Hobby plan compatibility).
- `listBackups` swallowed R2 errors as `[]`, rendering "No backups yet" for an
  unreachable bucket. It now throws; the action returns `{ok:false,error}` and the UI
  shows the actual storage error.

**Production log evidence (2026-09-09 08:47 UTC):**
`Failed to list backups: Unauthorized` — S3/R2 **401** on the admin deployment.
That is the "backups not showing" cause: the R2 credentials on the admin Vercel
project are invalid/rotated/missing (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
`R2_ACCOUNT_ID` or `S3_API` / `R2_BUCKET_NAME`). Pre-existing deploy issue — not
caused by code on this branch (no backup-surface commits between `6a9da87` and HEAD
prior to this session). After fixing the env vars, the backups page will show a real
error instead of a silent empty list if credentials break again.

### Deploy-time migration (replaces db-migrate.yml)

Vercel app builds failed with "Script not found db:migrate": app projects with a
Root Directory can't see root scripts, and migrations ran via a decoupled GitHub
Actions workflow, so deploys could go live without their migration.

- `scripts/vercel-build.mjs`: production deploys (`VERCEL_ENV=production` or
  `MIGRATE_ON_DEPLOY=1`) run `db:migrate` → `db:check` → build from the repo root;
  any failure aborts the deploy with the previous deployment left live. Previews
  never touch the database. Missing `DATABASE_URL` on production refuses to deploy.
- `apps/tracker/vercel.json` + `apps/admin/vercel.json`: `buildCommand` routes
  through the script.
- `.github/workflows/db-migrate.yml` deleted (superseded); `db-health-cron.yml`
  remains as the daily drift watchdog.

### R2 credential health check (surfacing the production 401 at deploy time)

- `checkR2Connection()` performs a real `HeadBucket` and classifies failures
  (not_configured / unauthorized / forbidden / not_found / network_error / unknown).
- `src/instrumentation.ts`: validates credentials when the admin server boots;
  logs prominently and emails `BACKUP_ALERT_EMAIL` once in production on failure.
- `GET /api/health/r2`: 200/503 for uptime monitors.
- 8 unit tests cover every failure class, including the exact observed 401 shape.

### RBAC hardening (branch core)

- `activeMemberWhere` (live member + live user) applied across tracker server modules
  and admin org/user queries so soft-deleted members/users never resolve as active.
- `withActiveAuthRows` filters Better Auth adapter calls below the adapter; member
  inserts upsert live rows; member deletes soft-delete.
- Owner-protected member removal; single-owner enforcement; new regression tests.

### CI self-heal

`Database Migrations & Schema Drift Check` failed on first push: the RBAC change
swapped CRUD guards to `requireOrgRole`, which calls `validateSessionAndOrg` through
the module's internal binding — Jest's factory mock can't intercept that, so the real
auth path ran in tests and `headers()` threw outside a request scope. Fixed by mocking
`requireOrgRole` alongside `validateSessionAndOrg`; all 11 integration tests pass.

## Verification

### Local pre-flight (6-point)

| Check | Result |
|---|---|
| `bun run check-types` | 🟢 4/4 tasks |
| `bun run lint` | 🟢 0 errors (13 pre-existing tracker warnings) |
| `bun run db:check` | 🟢 36/36 migrations registered |
| `bun run test` | 🟢 184 tracker + admin suite incl. new backup-alerts tests |
| `bun run build` | 🟢 all packages (admin build re-verified after health-check change) |
| Integration (Jest, local Postgres) | 🟢 11/11 after self-heal |
| vercel-build guard rails | 🟢 refuse-without-URL / preview-skip / migrate→verify→build |

### Remote CI on `86b7180` (PR #95) — all green

| Check | Result |
|---|---|
| Typecheck (tsc) | 🟢 |
| Lint (ESLint) | 🟢 |
| Code Formatting (Prettier) | 🟢 |
| Unit Tests (Jest & Vitest) | 🟢 |
| Database Migrations & Schema Drift Check | 🟢 (healed) |
| Production DB Drift Warning | 🟢 |
| Production Build Verification | 🟢 |
| Playwright End-to-End Tests | 🟢 |
| Security — Secret Scanning & Dependency Audit | 🟢 |
| GitGuardian Security Checks | 🟢 |
| Vercel Preview Comments | 🟢 |

## PR

**https://github.com/jchademwiri/pmg-tracker-360/pull/95** (`feat/user-roles-hardening` → `dev`)

## Post-merge deploy checklist

1. Set `DATABASE_URL` (production DB) on both tracker and admin Vercel projects —
   production deploys now refuse to run without it.
2. Fix the R2 credentials on the admin project (401 above) — backups and the backups
   page are dead until then; the startup log will now say exactly what is wrong.
3. Set `BACKUP_ALERT_EMAIL` on the admin project (failure notifications).
4. Redeploy and watch for `[startup] R2 backup storage OK`, then run a manual
   "Run Backup Now" from the admin `/backups` page.
