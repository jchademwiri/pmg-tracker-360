---
name: done
description: Runs automated end-to-end testing, executes full production build (bun run build), fixes any errors, commits changes to dev, pushes to origin/dev, and creates or updates a comprehensive PR to master. Use when the user types "/done", "done", "ship it", or requests to test, build, commit, push and PR.
metadata:
  author: pmg
  version: "1.0.0"
---

# Done Command (Full CI/CD Ship Workflow)

This skill automates the complete test-build-commit-push-PR workflow in a single command.

---

## Standard Execution Sequence

Whenever the user types `/done` or asks to finish and ship their changes:

### 1. Run Tests & Fix Errors
- Run unit/integration tests: `npm --prefix apps/tracker run test -- --passWithNoTests`
- Run Playwright E2E tests: `npx playwright test`
- If any test fails, inspect logs, fix the root cause, and re-run until all tests pass.

### 2. Run Production Monorepo Build
- Execute: `bun run build` (or `npx turbo run build`)
- Ensure all workspaces (`tracker`, `admin`, `docs`) compile successfully with 0 TypeScript/Turbopack errors.

### 3. Stage & Commit to `dev` Branch
- Run `git status` and `git diff --stat` to review changed files.
- Stage changes: `git add .`
- Commit with a descriptive conventional commit message (e.g. `feat(...)`, `fix(...)`, `refactor(...)`).

### 4. Push to Remote & Verify PR to `master`
- Push commits: `git push origin dev`
- Check existing PRs: `gh pr list`
- If an open PR from `dev` to `master` exists, update it with `gh pr edit` containing comprehensive release notes and test matrices.
- If no PR exists, create one targeting `master`:
  ```bash
  gh pr create --base master --head dev --title "feat: ..." --body "..."
  ```
- Report the final verification results and provide the GitHub PR link to the user.
