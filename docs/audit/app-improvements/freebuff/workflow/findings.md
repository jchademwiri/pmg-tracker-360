# Findings: End-to-End Workflow

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 05-workflow.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | End-to-end tender-to-project lifecycle mapping |
| **Depends On** | 01, 02, 03, 04 |

---

## Executive Summary

The tender-to-project lifecycle has significant gaps between tender discovery and project completion. While basic CRUD exists for tenders, projects, and POs, the intermediate steps — follow-up tracking, result recording, preparation tracking, partial delivery recording, and project close-out — are either missing or incomplete. The auto-conversion from awarded tender to project works but lacks customisation. The workflow is functional but not operationally useful.

**Overall Score: 4/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender Discovery | 5/10 | → |
| Tender Preparation | 3/10 | ↓ |
| Tender Submission | 6/10 | → |
| Follow-up & Result | 2/10 | ↓ |
| Tender-to-Project Handoff | 5/10 | → |
| Project Execution | 4/10 | → |
| PO & Delivery | 3/10 | ↓ |
| Project Close-out | 1/10 | ↓ |

---

## Current State

### Full Lifecycle Map

```
1.  Tender Opportunity Discovered     → Manual entry (no scraping/integration)
2.  Tender Registered                 → TenderForm creates record
3.  Tender Reviewed Internally        → Status change only (no tracking)
4.  Tender Approved for Preparation   → Status change only
5.  Tender Prepared                   → No preparation tracking
6.  Tender Submitted                  → Status change + submission date
7.  Tender Followed Up                → UI exists but NOT persisted in DB
8.  Tender Result Received            → Status change only (no details)
9.  Tender Awarded                    → Status = awarded
10. Tender Converted to Project       → autoCreateProjectForTender() works
11. Project Created                   → Basic project record
12. PO Created                        → POForm with line items
13. PO Items Ordered                  → Status = sent
14. Delivery Tracked                  → Delivery notes exist (basic)
15. Partial Deliveries Recorded       → Schema supports, UI doesn't
16. PO Completed                      → No workflow (manual status change)
17. Project Completed                 → No workflow (manual status change)
18. Project Archived                  → No archive functionality
```

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Follow-ups are not persisted — UI exists but data is lost on refresh | No `tenderFollowUp` table | Operational data loss | M |
| C2 | No result recording — cannot capture award amount, loss reason, or evaluation notes | `tender-details.tsx` | Cannot analyse win/loss patterns | M |
| C3 | No project close-out workflow — status change only | `project-form.tsx` | Projects linger as "active" indefinitely | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | No preparation tracking — cannot see which tenders are being worked on | — | No visibility into preparation pipeline | M |
| M2 | No partial delivery recording UI — schema supports it but UI doesn't | `po-details.tsx` | Cannot track incremental deliveries | M |
| M3 | Auto-conversion from tender to project doesn't customise project fields | `autoCreateProjectForTender()` | Generated projects need manual editing | S |
| M4 | No email/notification triggers at workflow milestones | — | Users miss important transitions | M |
| M5 | No activity log across the lifecycle — only security audit log | — | Cannot reconstruct what happened | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Status transitions have no validation — can jump states arbitrarily | Various | Inconsistent workflow | S |
| m2 | No workflow status visualisation (stepper/progress) | Various | Users don't know where they are in the lifecycle | S |
| m3 | No bulk status changes | Registers | Cannot update multiple items | S |
| m4 | No archived/completed items view | Registers | Completed items clutter active views | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add workflow status stepper to tender detail**
   - What: Show visual progress through tender lifecycle stages
   - Where: New `WorkflowStepper` component, `tender-details.tsx`
   - Expected outcome: Users see exactly where each tender is in the lifecycle

2. **Add notification triggers for key transitions**
   - What: Send notification when tender is submitted, result received, or deadline approaching
   - Where: Server functions for status changes
   - Expected outcome: Users are proactively informed

### Short-Term (1-2 weeks)

1. **Implement follow-up tracking with persistence**
   - What: Create `tenderFollowUp` table and wire up existing UI
   - Where: `schema.ts`, migration, `tender-details.tsx`
   - Expected outcome: Follow-ups persist across sessions

2. **Add result recording workflow**
   - What: Create result form with award amount, win/loss reason, evaluation notes
   - Where: New `ResultForm` component, schema updates
   - Expected outcome: Detailed outcome capture for analytics

3. **Implement partial delivery recording UI**
   - What: Add UI to record delivery per line item
   - Where: New `PartialDeliveryForm`, update `po-details.tsx`
   - Expected outcome: Track partial deliveries operationally

### Medium-Term (1-3 months)

1. **Build activity log system**
   - What: Create `activityLog` table tracking all lifecycle events
   - Where: `schema.ts`, all server functions
   - Expected outcome: Complete audit trail

2. **Implement project close-out workflow**
   - What: Add close-out steps: final delivery, invoice, completion certificate, archival
   - Where: New close-out components, schema updates
   - Expected outcome: Structured project completion

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Tender CRUD works; follow-ups not in DB; auto-conversion exists |
| 02-dashboard-audit | Dashboard shows deadlines and briefings |
| 03-tender-management | Tender form and detail structure |
| 04-project-management | Project and PO structure; delivery notes exist |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 09-forms-data-capture | Follow-up form and result form need multi-step design |
| 10-deliverables-roadmap | Activity log and workflow stepper are foundational |

---

## Implementation Notes

### Database Changes

- [ ] Create `tender_follow_up` table
- [ ] Create `activity_log` table
- [ ] Add `priority` and `risk_level` to tender
- [ ] Add `progress` to project

### API Changes

- [ ] Add `createTenderFollowUp()`, `getTenderFollowUps()`
- [ ] Add `recordTenderResult()`
- [ ] Add `createActivityLog()`, `getActivityLog()`
- [ ] Add `recordPartialDelivery()`
