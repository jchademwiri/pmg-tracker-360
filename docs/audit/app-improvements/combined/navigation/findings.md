# Combined Findings: Navigation

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 08-navigation.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | High |

---

## Reconciled Score

**Overall Score: 6.0/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 7.0/10 | +1.0 |
| codebuff | 5.0/10 | -1.0 |
| codex | 6.0/10 | +0.0 |
| **Average** | **6.0/10** | High |

Final reconciled score: **6.0/10, High confidence**. The sidebar is functional, but it does not expose the real workflow or urgent queues.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| C1 | No nav badge counts/urgency indicators. | Antigravity, codebuff, codex | Critical/Major | `AppSidebar`, `NavMain` |
| C2 | Command palette/keyboard quick navigation is missing. | Antigravity, codebuff, codex | Major | app shell |
| C3 | Sidebar IA is too flat or not aligned to tender/project workflow queues. | Antigravity, codebuff, codex | Major | `dashboad-links.ts` |
| C4 | Mobile navigation relies too much on sidebar/drawer, not a bottom nav/task mode. | codebuff, codex | Major | dashboard layout/sidebar |
| C5 | Module tabs are inconsistent or missing for deeper tender/project/PO pages. | Antigravity, codex | Major | project/tender pages |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Breadcrumb capitalization/labels need improvement. | Antigravity | Small polish and orientation improvement. |
| 2 | Add recent items section. | codebuff | Helpful for frequent users after core IA is fixed. |
| 3 | Clients should be treated as reference data, not a lifecycle peer. | codex | Good IA refinement for operations-first nav. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Navigation score | Antigravity 7 due strong shadcn sidebar. | codebuff 5 due no urgency/power features. | codex 6 due functional but incomplete IA. | Reconcile at 6: shell works; workflow navigation missing. |
| 2 | Rename target | codebuff suggests “Operations”. | codex suggests “Tender Management” and “Project Management”. | Antigravity focuses dashboard alignment. | Use explicit business module labels; group under Operations if desired. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Navigation lacks badge counts/urgency indicators. | sidebar/nav | Users cannot see urgent work from nav. | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | IA does not expose key tender/project workflow queues. | `dashboad-links.ts` | Users must hunt through registers. | M |
| M2 | Mobile navigation needs bottom nav or faster task mode. | app shell | Mobile navigation costs extra taps. | M |
| M3 | Command palette is missing. | app shell | Power users navigate slowly. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Breadcrumb labels, recent items, and Clients placement need refinement. | navigation | Orientation and IA polish. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Add nav badge counts**
2. **Rename groups and expose workflow links**

### Short-Term (Consensus)

1. Add module tabs for tender/project/PO workspaces.
2. Add mobile bottom navigation or mobile More drawer.
3. Implement command palette.

### Medium-Term (Consensus)

1. Add recent items and keyboard shortcuts.
2. Build workflow-based navigation once stages are stable.

### Investigate Further

1. Whether Purchase Orders should become top-level navigation.
2. Whether settings/user management belongs in sidebar.

---

## Open Questions

- Which nav badge counts are most important on first release?
- Should Clients remain top-level or move under reference data?
