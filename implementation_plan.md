# Implementation Plan: Fix DB Migration Pipeline & Workflow Gaps

## Overview
The production database (`ep-fancy-term-amoc8p56`) fell out of sync because `drizzle-kit migrate` silently skipped 3 migrations and the drift check was advisory-only. This plan hardens the CI/CD pipeline so drift is caught, alerted, and gated at every level.

## Audit Findings

### Current Workflows (5 total)
| Workflow | Purpose | Issue |
|----------|---------|-------|
| `ci.yml` | Quality gates (types, lint, format, tests, build) | Tests migrations against ephemeral container only — never checks real dev/prod DBs |
| `db-migrate.yml` | Applies migrations to dev or prod DB on push | `drizzle-kit migrate` can silently skip; post-migration check now fails but no alerting |
| `db-health-cron.yml` | Daily drift check at 06:00 SAST | Advisory only — exits 0 even on drift, no notification |
| `e2e.yml` | Playwright browser tests | Clean — uses ephemeral container |
| `security.yml` | Secret scanning + dependency audit | Clean — advisory by design |

### Key Secrets
- `DATABASE_URL` → Dev DB (`ep-gentle-night-am2xkits`)
- `DATABASE_URL_DEV` → Dev DB (same)
- `DATABASE_URL_STAGING` → Staging DB (same as dev)
- `DATABASE_URL_PRODUCTION` → Production DB (`ep-fancy-term-amoc8p56`)

---

## Proposed Changes

### 1. [MODIFY] `.github/workflows/db-health-cron.yml`
**Goal:** Make daily health check fail loudly + auto-create GitHub Issue on drift.

**Changes:**
- Add a new `check-and-alert` job that depends on both check jobs
- If either check fails, create a GitHub Issue titled "🚨 Database Drift Detected" with drift details
- Add Slack notification via `repository_dispatch` (optional, requires `SLACK_WEBHOOK_URL` secret)
- Workflow now fails (red badge) when drift is found

### 2. [MODIFY] `.github/workflows/ci.yml`
**Goal:** Warn about production DB drift on PRs to dev/master (non-blocking).

**Changes:**
- Add a new `db-prod-drift-check` job that runs ONLY on PRs to `dev` or `master`
- Uses `DATABASE_URL_PRODUCTION` secret to check prod DB drift status
- Runs as informational (warning annotation) — does NOT block PR merge
- Prevents the scenario where dev has migrations that prod doesn't

### 3. [MODIFY] `.github/workflows/db-migrate.yml`
**Goal:** Better error handling and alerting on migration failure.

**Changes:**
- Add a pre-migration migration count validation (compare expected vs applied before running)
- Add `continue-on-error: true` on the drift check step + a separate alert step that creates a GitHub Issue if drift is detected post-migration
- Add `actions/github-script` to annotate the workflow run with drift details

### 4. [NO CHANGE] `packages/db/scripts/check-drift.ts`
Already exits with code 1 on drift. No changes needed.

---

## What YOU Need To Do (Manual Steps)

### Required: Nothing for the core fixes
All changes are in workflow YAML files. They'll work with your existing secrets.

### Optional: Slack Notifications
If you want Slack alerts when drift is detected:
1. Create a Slack Incoming Webhook: https://api.slack.com/messaging/webhooks
2. Add it as a GitHub secret: `gh secret set SLACK_WEBHOOK_URL --repo jchademwiri/pmg-tracker-360`
3. The cron workflow will send a message to that channel when drift is found

### Optional: GitHub Issue Labels
The auto-created drift issues will use the `database` label. Create it in your repo if it doesn't exist:
```bash
gh label create "database" --color "0075ca" --description "Database schema & migration issues" --repo jchademwiri/pmg-tracker-360
```

---

## Verification Plan

1. **Local:** Run `bun run check-types` to verify no TypeScript issues in scripts
2. **CI:** Push the branch, verify all 5 workflows run without errors
3. **Drift test:** Manually trigger `db-health-cron.yml` with `workflow_dispatch` — should report IN SYNC
4. **Issue creation test:** The cron workflow will only create issues when drift is actually detected (we won't force-drift the prod DB to test)

---

## Files to Modify
| File | Action |
|------|--------|
| `.github/workflows/db-health-cron.yml` | MODIFY — add alert job + Issue creation |
| `.github/workflows/ci.yml` | MODIFY — add prod drift check job |
| `.github/workflows/db-migrate.yml` | MODIFY — add pre-migration validation + alert on failure |

## Risk Assessment
- **Low risk** — All changes are to CI/CD workflow files, not application code
- **No database changes** — No new migrations or schema modifications
- **Backward compatible** — Existing secrets and routing logic unchanged
