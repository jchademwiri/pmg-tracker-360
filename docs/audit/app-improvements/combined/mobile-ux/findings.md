# Combined Findings: Mobile UX

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 06-mobile-ux.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | Medium |

---

## Reconciled Score

**Overall Score: 4.8/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 6.0/10 | +1.2 |
| codebuff | 3.0/10 | -1.8 |
| codex | 5.5/10 | +0.7 |
| **Average** | **4.8/10** | High |

Final reconciled score: **4.8/10, Medium confidence**. Variance is high because codebuff generalized table overflow more broadly, while codex noted project and PO lists already have mobile cards.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| C1 | Tender register lacks a usable mobile card layout and relies on horizontal table behavior. | Antigravity, codebuff, codex | Critical | `TendersTable` |
| C2 | Filters are not mobile-optimized and should become bottom-sheet/drawer controls. | Antigravity, codebuff, codex | Major | register filter components |
| C3 | Complex forms are too long on mobile and need steppers/wizard flows. | Antigravity, codebuff, codex | Major | `TenderForm`, `ProjectForm`, `POForm` |
| C4 | Detail actions are hard to reach and need sticky bottom action bars. | Antigravity, codebuff, codex | Major | tender/project/PO detail pages |
| C5 | Mobile navigation needs a faster pattern than only collapsed/sidebar drawer navigation. | codebuff, codex | Major | dashboard layout/sidebar |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Existing global CSS enforces 44px touch target minimum. | Antigravity | Reduces severity of codebuff's “small buttons” claim; verify coverage. |
| 2 | Offline support and pull-to-refresh. | codebuff | Useful for field delivery users, but lower priority until core workflows exist. |
| 3 | Project and PO lists already have mobile cards but need better risk metadata. | codex | Prevents unnecessary rebuild; improve existing mobile cards. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Scope of table overflow | Antigravity names tenders/project lists broadly. | codebuff says all registers overflow. | codex says project/PO have mobile cards; tender lacks cards. | Verify each register. Treat tender as P0, improve project/PO cards as P1. |
| 2 | Mobile score | Antigravity 6 due responsive shell. | codebuff 3 due workflow unusability. | codex 5.5 due partial mobile implementation. | Reconcile at 4.8: shell responsive, core workflows not mobile-first. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Tender register lacks a mobile card mode. | `TendersTable` | Tender browsing is poor on phones. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Filters need mobile drawer/bottom-sheet behavior. | Registers | Filters crowd results. | M |
| M2 | Complex forms need mobile steppers. | Forms | Long mobile capture is error-prone. | M |
| M3 | Detail pages need sticky mobile action bars. | Details | Primary actions are hard to reach. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Offline/pull-to-refresh/swipe gestures need validation before prioritization. | Mobile shell | Nice-to-have until workflows stabilize. | M |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Add tender mobile cards**
2. **Add sticky mobile action bars**

### Short-Term (Consensus)

1. Convert filters to mobile bottom drawers.
2. Split complex forms into mobile-friendly steps.
3. Add bottom navigation or mobile task mode for Dashboard, Tenders, Projects, POs, More.

### Medium-Term (Consensus)

1. Add mobile-specific delivery capture flow.
2. Consider pull-to-refresh/offline cache only after core workflows are stable.

### Investigate Further

1. Actual mobile user persona and usage share.
2. Whether field receiving requires offline support.

---

## Open Questions

- Are mobile users tender admins, managers, field delivery staff, or all three?
- What fields should be shown on tender/project/PO mobile cards?
