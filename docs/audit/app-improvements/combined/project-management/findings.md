# Combined Findings: Project Management

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 04-project-management.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | High |

---

## Reconciled Score

**Overall Score: 4.5/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 4.0/10 | -0.5 |
| codebuff | 4.0/10 | -0.5 |
| codex | 5.4/10 | +0.9 |
| **Average** | **4.5/10** | Moderate |

Final reconciled score: **4.5/10, High confidence**. All models agree this is one of the weakest operational areas.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| 1 | PO line items are not implemented as operational CRUD/UI. | Antigravity, codex | Critical | `purchase-orders.ts`, `POForm`, `PODetails` |
| 2 | Partial delivery/delivery note UI is missing despite schema support. | Antigravity, codebuff, codex | Critical | PO detail/server/actions |
| 3 | PO status model is too limited for real fulfillment. | Antigravity, codebuff, codex | Critical/Major | `PurchaseOrderCreateSchema`, PO components |
| 4 | Project detail is too sparse and lacks linked POs, delivery progress, contract/milestone visibility. | Antigravity, codebuff, codex | Critical/Major | `projects/[id]/page.tsx` |
| 5 | Project overview lacks project/PO health metrics such as awaiting PO, overdue deliveries, partial deliveries, delayed work. | codebuff, codex | Major | `projects/overview/page.tsx`, `getProjectStats` |
| 6 | Project/PO completion lacks guardrails and closeout workflow. | codebuff, codex | Major | project/PO status actions |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Awaiting-PO status should be tracked for active projects. | Antigravity | High operational value; easy dashboard/register queue. |
| 2 | Project progress percentage/phases/milestones. | codebuff | Useful but should follow PO/delivery implementation. |
| 3 | PO search excludes PO number despite UI placeholder. | codex | Small correctness issue, likely quick fix. |
| 4 | PO number uniqueness may need organization scope. | codex | Prevents cross-org collision risk; validate business rules. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | PO form current line item support | Antigravity says no line item grid. | codebuff text inconsistently says POForm with line items but still flags no partial delivery/progress. | codex says header-only form. | Verify current code; evidence points to header-only form. Treat line-item editor as required. |
| 2 | Project register mobile quality | codebuff rates project register 4. | codex notes project list already has mobile cards and gives register 7. | Antigravity says register is fair at 6. | Do not rebuild register first; prioritize detail/workspace and delivery states. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line items and delivery-note/partial-delivery workflows are missing. | PO server/UI | Cannot track ordered vs delivered quantities. | L |
| C2 | Project detail is not a project workspace with POs and delivery progress. | `projects/[id]/page.tsx` | Project health is invisible in context. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | PO statuses are too limited. | PO validation/UI | Fulfillment lifecycle is inaccurate. | S |
| M2 | Project overview lacks delivery/awaiting-PO risk metrics. | projects overview/server | Managers miss operational delays. | M |
| M3 | Completion lacks guardrails. | project/PO actions | Records can be closed without evidence. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | PO search/number scope and project copy need cleanup. | PO/project pages | Small correctness and polish issues. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Expand PO statuses**
2. **Show linked POs on project detail**
3. **Fix PO number search**

### Short-Term (Consensus)

1. Build project/PO mini dashboard with active, awaiting PO, overdue, partial, delivered value metrics.
2. Implement PO line-item input grid.
3. Upgrade project detail into tabs/workspace.

### Medium-Term (Consensus)

1. Implement delivery note capture and partial delivery quantities.
2. Add project closeout workflow and completion guardrails.

### Investigate Further

1. Project phases/milestones and budget dashboard.
2. Organization-scoped PO number uniqueness.

---

## Open Questions

- Which users record delivery notes?
- Should PO line items be mandatory for all POs?
- Should project completion be blocked until all POs are completed?
