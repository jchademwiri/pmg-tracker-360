# Combined Findings: Forms Data Capture

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 09-forms-data-capture.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | High |

---

## Reconciled Score

**Overall Score: 5.0/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 5.5/10 | +0.5 |
| codebuff | 4.0/10 | -1.0 |
| codex | 5.6/10 | +0.6 |
| **Average** | **5.0/10** | Moderate |

Final reconciled score: **5.0/10, High confidence**. Validation foundations are good, but complex operational capture is incomplete.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| C1 | PO line-item and partial delivery forms are missing/incomplete. | Antigravity, codebuff, codex | Critical | `POForm`, `PODetails`, PO server actions |
| C2 | Document upload/evidence capture is disabled or unavailable. | codebuff, codex | Critical | tender forms/details |
| C3 | No draft/autosave pattern for complex forms. | Antigravity, codebuff, codex | Major | all complex forms |
| C4 | Tender form and other complex forms are too long and need multi-step flows. | codebuff, codex | Major | `TenderForm`, `POForm` |
| C5 | Business validation is incomplete for transitions, dates, quantities, and completion. | Antigravity, codebuff, codex | Major | validation/server actions |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Auto-format currencies and shortcut submit. | Antigravity | Useful efficiency polish, lower than missing workflows. |
| 2 | Field-level help text and conditional fields. | codebuff | Strong UX improvement for complex procurement terms. |
| 3 | Project form omits contract fields that schema supports. | codex | Important for manual project creation and award handoff. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Quick win priority | Antigravity prioritizes currency/keyboard. | codebuff prioritizes upload/protection/help. | codex prioritizes transition dialogs/PO validation. | Prioritize disabled upload and transition dialogs; treat currency/keyboard as polish. |
| 2 | Draft scope | Antigravity suggests localStorage hook. | codebuff/codex imply persistent draft capability. | — | Start local draft for low risk; add DB draft when statuses/workflows require collaboration. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line-item and partial delivery forms are missing. | PO form/detail/server | Delivery cannot be captured accurately. | L |
| C2 | Document/proof upload is unavailable. | tender forms/details | Evidence capture is blocked. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | No draft/autosave pattern. | forms | Long-form data loss risk. | M |
| M2 | Complex forms need multi-step structure. | forms | High cognitive load. | M |
| M3 | Business-rule validation is incomplete. | validation/server actions | Invalid transitions/quantities can occur. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Help text, currency formatting, shortcuts, and conditional fields need polish. | forms | Improves speed and clarity. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Re-enable document/proof upload**
2. **Add transition-specific dialogs**
3. **Add submission protection and field guidance**

### Short-Term (Consensus)

1. Break tender form into multi-step flow.
2. Implement draft/autosave.
3. Add PO line item grid with calculated totals.

### Medium-Term (Consensus)

1. Build delivery note and partial delivery capture wizard.
2. Add form wizard component and business-rule validation.

### Investigate Further

1. Local-only draft vs server-persisted draft.
2. Required fields by organization/tender type.

---

## Open Questions

- Which forms must support collaborative drafts?
- Which evidence uploads are mandatory before each transition?
