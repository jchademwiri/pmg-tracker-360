# Combined Findings: Codebase Audit

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 01-codebase-audit.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | High |

---

## Reconciled Score

**Overall Score: 5.8/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 6.5/10 | +0.7 |
| codebuff | 5.0/10 | -0.8 |
| codex | 5.8/10 | +0.0 |
| **Average** | **5.8/10** | Moderate |

Final reconciled score: **5.8/10, High confidence**. All models agree the architecture is solid but the operational lifecycle is incomplete.

---

## Consensus Issues (High Confidence)

> Flagged by 2-3 models. Treat as confirmed.

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| 1 | PO line items, delivery notes, and partial delivery quantities exist in schema but are not implemented in server/UI workflows. | Antigravity, codebuff, codex | Critical | `packages/db/src/schema.ts`, `server/purchase-orders.ts`, PO components |
| 2 | Tender-to-project availability uses `won` while the app uses `awarded`. | Antigravity, codex | Critical | `server/tenders.ts` `getAvailableTendersForProjects` |
| 3 | Document upload/management is visibly disabled or unavailable in tender workflows despite backend/schema support. | codebuff, codex | Critical | `TenderForm`, `TenderDetails`, `DocumentManager` |
| 4 | Project detail is too thin and does not show POs, delivery health, contract data, risks, or closeout. | Antigravity, codex | Major | `projects/[id]/page.tsx` |
| 5 | Mobile register/detail experience is weak, especially tender table and detail layout. | codebuff, codex | Major | `TendersTable`, `TenderDetails` |
| 6 | Status presentation/model is inconsistent or too limited for workflow. | codebuff, codex | Major | status maps, validation schemas, badges |
| 7 | Browser-native confirmations/alerts reduce polish. | Antigravity, codex | Minor | tender/PO detail actions |

---

## Unique Insights (Medium Confidence)

> Flagged by 1 model only. Investigate before acting.

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Member role may be over-restricted from PO viewing/receiving tasks. | Antigravity | Important if field users must record deliveries. Validate role/persona expectations. |
| 2 | No activity log table beyond security audit log. | codebuff | Strong foundation for workflow timelines and auditability, even though not all models escalated it in codebase audit. |
| 3 | Search/count queries may use selected row length rather than aggregate counts. | codex | Could affect pagination correctness at scale; verify query implementations before prioritizing. |
| 4 | Duplicate UI primitives between app-local and package UI. | Antigravity | Design-system maintainability issue; lower urgency than workflow defects. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Overall app maturity | Antigravity scores 6.5 and calls tender strong. | codebuff scores 5 with sharper mobile/design concerns. | codex scores 5.8 with mixed foundation/workflow view. | Use **5.8**. Architecture is mature; operational workflow is not. |
| 2 | Mobile register coverage | Antigravity and codebuff imply broad table overflow. | codebuff says all registers overflow. | codex notes project/PO have mobile cards but tender does not. | Verify current UI: treat tender as confirmed gap; improve project/PO cards rather than rebuild from zero. |
| 3 | Document upload severity | codebuff/codex critical. | Antigravity does not elevate in codebase audit. | codex ties it to evidence/compliance. | Treat as high priority because tender packs/proofs are core workflow evidence. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line items/delivery notes/partial delivery are not implemented in operational UI/server workflows. | PO schema/server/UI | Cannot track fulfillment accurately. | L |
| C2 | `won` vs `awarded` tender status mismatch can hide awarded tenders from project creation. | `server/tenders.ts` | Breaks manual tender-to-project flow. | S |
| C3 | Document upload/evidence capture is unavailable in tender workflow. | Tender form/detail | Blocks compliance and proof capture. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Project detail lacks PO/delivery/contract workspace. | `projects/[id]/page.tsx` | Managers cannot assess project health. | M |
| M2 | Mobile tender register/detail experience is weak. | `TendersTable`, `TenderDetails` | Mobile workflow is impractical. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Native confirms/alerts and duplicated UI primitives reduce polish. | UI components/actions | Design-system consistency risk. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Fix tender availability status mismatch**
2. **Create shared status labels/colors**
3. **Replace browser-native confirms/alerts**

### Short-Term (Consensus)

1. Add PO line-item CRUD/UI and project detail PO summaries.
2. Re-enable document management in tender detail/form.
3. Add mobile tender cards.

### Medium-Term (Consensus)

1. Build partial delivery tracking with delivery notes, quantities, outstanding totals, and status automation.
2. Add activity/workflow event logging.

### Investigate Further

1. Member role access to PO receive/update workflows.
2. Pagination count correctness in server queries.
3. Scope and location of shared UI package consolidation.

---

## Open Questions

- Which roles should view POs and record delivery receipts?
- Should tender/project/PO statuses become DB enums or app-controlled text values?
- Are document attachments mandatory evidence at submission, award, delivery, and closeout?
