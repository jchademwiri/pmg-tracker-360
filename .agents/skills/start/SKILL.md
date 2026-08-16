---
name: start
description: Global task initialization skill. Auto-stashes dirty workspace changes, syncs latest dev, prunes old merged & gone branches, creates an isolated feature branch (feat/<slug>), performs a deep codebase audit, and generates an implementation plan (implementation_plan.md) with review request before coding. Use when starting a new task or chat, or when the user types "/start", "start", "new task", or "start task".
metadata:
  author: pmg
  version: "2.0.0"
---

# Start Command (Global Isolated Task Initialization & Codebase Audit)

This skill ensures every new chat or feature task begins in complete isolation on a clean, up-to-date branch derived from `dev`, with working tree safety, automated branch cleanup, deep codebase audits, and structured implementation planning.

---

## Workflow Decision Matrix

```mermaid
flowchart TD
    Start(["User triggers /start <task description>"]) --> StashCheck{"1. Check Working Tree Dirty?\n(git status --porcelain)"}
    StashCheck -->|Dirty| AutoStash["Auto-Stash Changes\n(git stash push -m 'stash-before-start-...')"]
    StashCheck -->|Clean| SyncDev["2. Checkout & Pull Latest dev\n(git checkout dev && git pull origin dev)"]
    AutoStash --> SyncDev
    
    SyncDev --> CleanupOld["3. Prune Merged & Gone Local Branches\n(Excludes dev, master, main)"]
    CleanupOld --> CreateBranch["4. Create Isolated Feature Branch\n(git checkout -b feat/<task-slug>)"]
    CreateBranch --> CodebaseAudit["5. Codebase Audit & Inspection\n(Search components, APIs, schema, routes)"]
    CodebaseAudit --> PlanArtifact["6. Generate Implementation Plan\n(Write implementation_plan.md artifact)"]
    PlanArtifact --> WaitApproval(["7. Request User Approval & Stop Turn\n(Wait for user to say 'proceed')"])
```

---

## Detailed Execution Sequence

Whenever the user starts a task or types `/start [task description]`:

### Step 1: Working Tree Safety (Auto-Stash if Dirty)
Check for uncommitted files or scratch edits before switching branches:
```bash
git status --porcelain
```
If output is not empty, safely stash changes so checkout is never blocked:
```bash
git stash push -u -m "stash-before-start-$(date +%s)"
```

---

### Step 2: Sync with Latest `dev`
1. Checkout the base development branch:
   ```bash
   git checkout dev
   ```
2. Pull latest updates from remote `origin/dev`:
   ```bash
   git pull origin dev
   ```

---

### Step 3: Prune Merged & Gone Local Branches
Clean up old feature branches that have been merged or deleted remotely on GitHub, while keeping `dev`, `master`, and `main` strictly protected:
```powershell
# Fetch remote prunes
git fetch origin --prune

# 1. Delete standard merged branches (excluding dev, master, main)
git branch --merged dev | Where-Object { $_.Trim() -notmatch '^(dev|master|main|\*)' } | ForEach-Object { git branch -d $_.Trim() }

# 2. Delete squash-merged branches whose remote tracking is ': gone]'
git branch -vv | Where-Object { $_ -match ': gone\]' -and $_.Trim() -notmatch '^(dev|master|main|\*)' } | ForEach-Object {
    $b = ($_ -split '\s+')[0].Replace('*','').Trim()
    if ($b -and $b -notin @('dev', 'master', 'main')) { git branch -D $b }
}
```

---

### Step 4: Create a Dedicated Feature Branch
1. Derive a clean, kebab-case slug based on the user's prompt (e.g. `feat/tender-table-wrap`, `fix/login-redirect`, `feat/export-csv`).
2. Create and switch to the new feature branch:
   ```bash
   git checkout -b feat/<slug>
   ```

---

### Step 5: Codebase Audit & Investigation
Before writing or modifying any source code:
1. Search and inspect all relevant files, UI components, database schemas, server actions, and API routes related to the request.
2. Identify existing patterns, reusable helpers, edge cases, accessibility standards, and responsive requirements.
3. Check for potential side-effects or regressions in related modules.

---

### Step 6: Generate the Implementation Plan Artifact
1. Create or update the `implementation_plan.md` artifact (in `<appDataDir>\brain\<conversation-id>\implementation_plan.md`):
   - **Overview & User Goals**: Concise summary of what will be built or fixed.
   - **Audit Findings**: Existing code state, key files involved, and architectural context.
   - **Proposed Changes**: Exact file-by-file breakdown with `[MODIFY]`, `[NEW]`, or `[DELETE]`.
   - **Verification & Test Plan**: Automated test commands and manual verification checkpoints.
   - **User Review / Open Questions**: Highlight critical design choices or decisions.
2. Set `RequestFeedback: true` and `UserFacing: true` on the artifact metadata.

---

### Step 7: Request User Approval
Output a clear summary of the newly created branch name, the audit findings, and point the user to the `implementation_plan.md` artifact. Stop calling tools to wait for the user to review and reply with `proceed`.
