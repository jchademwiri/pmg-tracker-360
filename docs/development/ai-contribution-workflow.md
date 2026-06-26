# AI Contribution Workflow

Status: Active  
Owner: PMG Tracker 360  
Created: 2026-06-25

## Purpose

This document records the required workflow for AI-assisted changes in this repository.

The application is already published and in use. Production/stable branches must be protected from direct AI commits unless Jacob explicitly instructs otherwise.

## Required Branch Rule

AI-assisted commits must not be made directly to `master`.

Default workflow:

1. Treat `master` as production/stable.
2. Treat `dev` as the integration branch.
3. Before making any code or documentation change, create a dedicated working branch from `dev`.
4. Commit the change to that dedicated branch only.
5. Jacob will review the change and merge it into `dev` when approved.

## Required Branch Naming

Use a descriptive branch name for each change.

Examples:

```txt
pdf-report-branding-workflow-docs
pdf-report-generator-foundation
tracker-tender-register-pdf
tracker-purchase-order-pdf
admin-platform-overview-pdf
```

Avoid committing directly to:

```txt
master
dev
```

unless Jacob explicitly gives a direct instruction for that exact change.

## Pre-Commit Checklist

Before committing on Jacob's behalf, confirm:

```txt
[ ] I am not on master
[ ] I am not committing directly to dev unless explicitly instructed
[ ] My branch was created from dev
[ ] The branch name matches the change purpose
[ ] The change is limited to the requested scope
[ ] I can clearly explain what files changed
```

## Merge Responsibility

Jacob will review and merge AI-created branches into `dev`.

AI should provide:

- Branch name.
- Commit SHA or commit summary.
- Files changed.
- Any known limitations or follow-up work.

## Emergency Rule

If a change is accidentally committed to `master`, correct it safely:

1. Put the intended change onto a branch created from `dev`.
2. Remove or revert the accidental change from `master` without force-pushing.
3. Do not move branch refs unless Jacob explicitly instructs it.
4. Report exactly what was corrected.
