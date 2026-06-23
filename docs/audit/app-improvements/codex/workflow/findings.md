## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 05-workflow.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | End-to-end tender discovery through project/PO delivery and closeout workflow |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md, 03-tender-management.md, 04-project-management.md |

---

## Executive Summary

The app covers the outer shell of the tender-to-project journey: tender registration, status updates, award-to-project conversion, project registration, PO creation, and PO delivered status. The operational middle is incomplete: review/preparation steps, submission proof, follow-ups, result details, project delivery workspace, itemized POs, partial delivery notes, and closeout guardrails are missing or underused. The recommended workflow should be explicit, state-driven, and queue-backed so users always know the next valid action.

**Overall Score: 5/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender lifecycle | 5/10 | -> |
| Project handoff | 6/10 | -> |
| PO fulfillment | 3/10 | -> |
| Automation/readiness | 4/10 | -> |
| Safeguards | 4/10 | -> |

---

## Current State

### What Exists Today

Tender opportunity can be registered, given dates/contact/briefing info, filtered in register, updated through broad statuses, extended through extension records, and converted to a project when awarded. Projects can be created manually or from awarded tenders. POs can be created under projects and marked sent/delivered. Calendar/dashboard functions expose some tender and PO dates.

### Architecture Notes

Status changes are mostly direct mutations. There is no activity/event table for reliable workflow history. Notification preferences exist, but lifecycle reminders are not fully generated from workflow data.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO partial delivery workflow is not implemented despite schema support. | PO server/UI | The project completion half of the lifecycle cannot be managed accurately. | L |
| C2 | Tender preparation and submission workflow is not represented as explicit states. | Tender schema/UI | Users cannot distinguish opportunity review, preparation, ready-to-submit, submitted, and awaiting-result work. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Follow-up reminders and logs are missing. | Tender schema/UI/dashboard | Submitted tenders can be forgotten after submission. | M |
| M2 | Evidence gates are missing for key transitions. | Tender/PO details | Submitted, awarded, delivered, and completed states can be set without proof. | M |
| M3 | Award-to-project handoff creates project but does not carry a full handoff checklist. | `autoCreateProjectForTender` | Contract docs, award date, PO readiness, and project setup tasks are incomplete. | M |
| M4 | Project completion is not tied to PO delivery state. | project server/UI | Projects may be closed without delivery completion checks. | M |
| M5 | Navigation does not follow workflow sequence. | Sidebar/routes | Users must manually jump between registers and details. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Automatic tender close on expired open tenders can obscure “missed submission” vs intentional closed. | `autoCloseExpiredTenders` | Reporting may lose nuance. | S |
| m2 | Recent activity infers updates from timestamps instead of event records. | `getRecentActivity`, `getRecentProjectActivities` | Activity history can be misleading. | M |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Define canonical workflow statuses**
   - What: Document and centralize tender/project/PO states and valid transitions.
   - Where: `lib/status-ui.ts`, validation files
   - Expected outcome: Shared language before UI build-out.

2. **Add missing queue routes**
   - What: Add links/filters for follow-ups due, awarded not converted, overdue deliveries.
   - Where: navigation and register filters
   - Expected outcome: Users can find lifecycle exceptions.

### Short-Term (1-2 weeks)

1. **Add workflow timeline**
   - What: Record tender/project/PO state changes, document uploads, delivery notes, and comments.
   - Where: DB activity table and detail pages
   - Expected outcome: Traceable lifecycle history.

2. **Add transition guardrails**
   - What: Require submission proof before submitted, result details before awarded/lost, delivery notes before delivered/completed.
   - Where: server actions and dialogs
   - Expected outcome: Better data quality and fewer false states.

### Medium-Term (1-3 months)

1. **Build end-to-end workflow engine**
   - What: State machine or transition helper for tender/project/PO actions, notifications, and dashboard queues.
   - Where: shared workflow service/server actions
   - Expected outcome: Predictable lifecycle and automation.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Workflow map | Implicit in routes/statuses | Explicit lifecycle map and transition rules | P0 |
| Tender timeline | Missing | Stage, documents, follow-ups, results | P0 |
| Project handoff | Auto project creation | Handoff checklist from award to active project | P1 |
| PO fulfillment | Header status | Line items, delivery notes, quantities, completion | P0 |
| Notifications | Preferences exist | Lifecycle-driven reminders | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Schema/routes exist but workflow is incomplete. |
| 02-dashboard-audit | Dashboard needs action queues and risk alerts. |
| 03-tender-management | Tender needs stages, checklist, follow-up, result capture. |
| 04-project-management | Project/PO needs delivery tracking and closeout guardrails. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 10-deliverables-roadmap | Workflow engine, activity timeline, and delivery tracking should drive roadmap sequencing. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/server/tenders.ts
apps/tracker/src/server/projects.ts
apps/tracker/src/server/purchase-orders.ts
apps/tracker/src/components/tenders/*
apps/tracker/src/components/projects/*
apps/tracker/src/components/purchase-orders/*
packages/db/src/schema.ts
```

### New Files Required

```text
apps/tracker/src/lib/workflow.ts
apps/tracker/src/components/shared/workflow-timeline.tsx
apps/tracker/src/server/workflow-activity.ts
```

### Database Changes

- [ ] Add workflow activity/events table.
- [ ] Add tender/project/PO transition metadata fields or related detail tables.

### API Changes

- [ ] Add transition-specific server actions instead of generic status flips.

---

## Open Questions

- [ ] Which transitions require manager approval?
- [ ] What evidence is mandatory at submission, award, delivery, and closeout?

---

## Appendix

### Screenshots / Visual References

### Structured Workflow Map

| Step | Current State | Recommendation |
|------|---------------|----------------|
| 1. Opportunity discovered | Manual tender creation | Add opportunity/review stage |
| 2. Tender registered | Exists | Add assigned owner and priority |
| 3. Internal review | Missing | Add review/approve step |
| 4. Preparation | Missing | Add checklist and document readiness |
| 5. Submitted | Status update only | Require proof and submitted date |
| 6. Followed up | Missing | Add follow-up log and due dates |
| 7. Result received | Status only | Capture result, reason, documents |
| 8. Awarded | Creates project | Add handoff checklist |
| 9. Project created | Exists | Surface contract data and POs |
| 10. PO created | Header only | Add line items |
| 11. Delivery tracked | Status only | Add delivery notes and quantities |
| 12. PO completed | Missing distinct state | Add completion guardrail |
| 13. Project completed | Status only | Require all POs completed |

### Research Sources

- Cooperative dashboard/workflow heuristics: https://arxiv.org/abs/2308.04514
- W3C error prevention/input assistance guidance: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html and https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
