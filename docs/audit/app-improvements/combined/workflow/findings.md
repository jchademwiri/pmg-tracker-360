# Combined Findings: Workflow

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 05-workflow.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | High |

---

## Reconciled Score

**Overall Score: 5.0/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 6.0/10 | +1.0 |
| codebuff | 4.0/10 | -1.0 |
| codex | 5.0/10 | +0.0 |
| **Average** | **5.0/10** | High |

Final reconciled score: **5.0/10, High confidence**. Basic CRUD lifecycle exists, but the operational transitions and delivery loop are incomplete.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| 1 | PO line-item and delivery-note workflow is missing, blocking partial delivery and project progress automation. | Antigravity, codebuff, codex | Critical | `purchase-orders.ts`, PO UI |
| 2 | Tender preparation/follow-up/result workflow is incomplete or not persisted. | codebuff, codex | Critical | tender schema/server/UI |
| 3 | Tender-to-project handoff has a status mismatch or lacks full handoff customization. | Antigravity, codebuff, codex | Critical/Major | `server/tenders.ts`, `autoCreateProjectForTender` |
| 4 | Project/PO completion is manual and lacks guardrails/automation. | Antigravity, codebuff, codex | Major | project/PO server actions |
| 5 | Notification/reminder triggers are missing for deadlines, validity, follow-ups, and overdue deliveries. | Antigravity, codebuff, codex | Major | notifications/server workflow |
| 6 | Activity/workflow history is insufficient. | codebuff, codex | Major | missing activity log/event table |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Manual bid number generation can cause formatting errors. | Antigravity | Useful validation/formatting improvement. |
| 2 | No archived/completed item views. | codebuff | Helps keep active registers clean after closeout exists. |
| 3 | Status changes should become transition-specific actions rather than generic flips. | codex | Strong architectural direction for guardrails. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Auto-conversion status | Antigravity says blocked by `won`/`awarded`. | codebuff says auto-conversion works but lacks customization. | codex says manual availability bug exists and handoff needs checklist. | Fix status bug immediately, then improve handoff fields/checklist. |
| 2 | Tender lifecycle score | Antigravity scores tender lifecycle 8. | codebuff scores prep/follow-up/result very low. | codex scores tender lifecycle 5. | Separate CRUD from workflow; workflow score remains 5. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO fulfillment loop is incomplete: no line-item delivery quantities or delivery notes. | PO server/UI | End-to-end lifecycle cannot complete accurately. | L |
| C2 | Tender follow-up/result/preparation workflow is incomplete. | Tender schema/server/UI | Tender operations are not auditable or actionable. | L |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender-to-project handoff needs bug fix and richer handoff data. | tender/project server | Awarded work setup is unreliable/incomplete. | M |
| M2 | Project/PO completion lacks automation and validation. | workflow actions | Manual status flips can be false. | M |
| M3 | Notifications/activity events are insufficient. | notification/activity layer | Users miss transitions and history. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Archive/completed views and bid-number formatting need later refinement. | workflow/registers | Reduces long-term usability. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Fix awarded-to-project handoff**
2. **Add workflow stepper/status map**

### Short-Term (Consensus)

1. Persist tender follow-ups.
2. Add result capture workflow.
3. Implement partial delivery recording UI.
4. Add notification triggers for key dates and transitions.

### Medium-Term (Consensus)

1. Build activity log/event system.
2. Automate PO/project progress based on delivery quantities.
3. Add project closeout workflow.

### Investigate Further

1. Workflow state machine vs simpler transition helper.
2. Which transitions require approvals.

---

## Open Questions

- What are the mandatory lifecycle states?
- What evidence is required before each state transition?
- Should notifications be scheduled jobs, generated on dashboard load, or both?
