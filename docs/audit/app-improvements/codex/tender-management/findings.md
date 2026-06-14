## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 03-tender-management.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Tender overview, register, detail page, workflow, status model, and award conversion |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md |

---

## Executive Summary

Tender Management has a real module foundation: overview, register, create/edit form, detail page, extension tab, deadline widgets, briefing dates, and automatic award-to-project creation. It is still missing the operational middle of tender work: review/approval/preparation stages, document and compliance checklists, submission proof, follow-up logs, result capture, and a reliable mobile register. The module should evolve from status browsing into a tender command center with queue cards, a pipeline board, and a detail page that drives every next action.

**Overall Score: 5.8/10**

| Area | Score | Trend |
|------|-------|-------|
| Tender overview | 6/10 | -> |
| Tender register | 6/10 | -> |
| Tender detail | 5/10 | -> |
| Workflow completeness | 5/10 | -> |
| Award conversion | 6/10 | -> |

---

## Current State

### What Exists Today

`/tenders/overview` shows total tenders, win rate, total value, upcoming deadlines, status cards, a pipeline funnel, closing-soon widget, deadlines, and recent activity. `/tenders` is a searchable/filterable register rendered through `TendersOverviewClient` and `TendersTable`. `/tenders/create` and `/tenders/[id]/edit` use `TenderForm`. `/tenders/[id]` uses `TenderDetails` with overview/documents/extensions tabs and status actions. Awarding a tender can create a linked project through `TenderToProjectDialog` and server-side `autoCreateProjectForTender`.

### Architecture Notes

Tender data is stored in `tender` with fields for number, client, description, submission date, value, status, validity dates, follow-up contact, briefing date/location/mandatory/attended, and soft deletion. Extensions are modeled separately in `tender_extension`. Documents are modeled but not exposed in tender UI beyond disabled placeholders.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Tender document upload/management is visibly unavailable despite document schema/server support. | `TenderForm`, `TenderDetails` | Tender packs, compliance docs, proof of submission, and award letters cannot be captured in the active workflow. | M |
| C2 | Manual project creation uses `won` status while tender statuses use `awarded`. | `getAvailableTendersForProjects` | Awarded tenders can be hidden from project creation. | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender lifecycle has only broad statuses. | `TenderCreateSchema`, `TenderDetails` | No support for New Opportunity -> To Review -> Approved -> In Preparation -> Ready -> Submitted -> Awaiting Result. | M |
| M2 | Tender detail page lacks preparation checklist and submission readiness. | `TenderDetails` | Users cannot see if compulsory requirements, pricing, documents, and sign-offs are complete. | M |
| M3 | No follow-up log or next follow-up date. | Schema/server/UI | Awaiting-result tenders cannot be managed proactively. | M |
| M4 | Result capture is status-only. | `TenderDetails`, `updateTenderStatus` | Lost/awarded/cancelled outcomes lack reason, award value, award date, result document, and competitor notes. | M |
| M5 | Tender register lacks mobile cards and risk indicators. | `TendersTable` | Mobile users and high-volume tender admins have poor scanability. | M |
| M6 | Status change actions are unguided and do not require evidence. | `TenderDetails` | Users can mark submitted/awarded/lost without proof or required fields. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Pipeline funnel uses current coarse statuses, not preparation workflow stages. | `PipelineFunnel` | It communicates less about real tender progress. | S |
| m2 | Tender form is long and not step-based. | `TenderForm` | Data entry feels heavier than necessary. | M |
| m3 | Status labels mix “Awarded” and “Appointed / Awarded”. | Tender components | Terminology should be standardized. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Fix awarded tender availability**
   - What: Change `won` lookup to `awarded`.
   - Where: `apps/tracker/src/server/tenders.ts`
   - Expected outcome: Manual project creation works with current statuses.

2. **Add mobile tender cards**
   - What: Match the project/PO card pattern and prioritize tender number, client, status, closing date, days left, briefing, value.
   - Where: `apps/tracker/src/components/tenders/tenders-table.tsx`
   - Expected outcome: Tender register is usable from phones.

3. **Make tender status cards queue links**
   - What: Add links for closing today/week, briefings, awaiting result, awarded not converted.
   - Where: `tenders/overview/page.tsx`, tender server stats
   - Expected outcome: Overview becomes action-oriented.

### Short-Term (1-2 weeks)

1. **Add tender workflow stage**
   - What: Introduce separate `stage` or richer `status` values for review/preparation/submission/result lifecycle.
   - Where: DB schema, validations, register filters, detail actions
   - Expected outcome: Users know exactly where each tender sits.

2. **Build tender detail workspace**
   - What: Add summary, key dates, requirements checklist, document checklist, pricing/preparation state, submission proof, follow-up log, extension history, result panel, conversion action.
   - Where: `TenderDetails`, new tender components
   - Expected outcome: One page controls the full tender lifecycle.

3. **Enable document manager**
   - What: Use existing `DocumentManager`/document server actions for tender packs and proof files.
   - Where: `TenderForm`, `TenderDetails`
   - Expected outcome: Evidence and compliance become auditable.

### Medium-Term (1-3 months)

1. **Add automated reminders and safeguards**
   - What: Notify for closing dates, mandatory briefings, follow-ups, validity expiries, and missing submission proof.
   - Where: notification tables/server jobs/dashboard queues
   - Expected outcome: Fewer missed tender actions.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Tender overview | KPI/status/deadline dashboard | Add stage pipeline and action queues | P0 |
| Pipeline funnel | Coarse status funnel | Operational stage board | P0 |
| Tender register | Desktop table + filters | Desktop table plus mobile cards and risk chips | P0 |
| Tender form | Long single-page form | Stepper with draft/review/evidence upload | P1 |
| Tender detail | Basic info/status/doc placeholders/extensions | Full workflow workspace | P0 |
| Extension list | Exists | Keep, add timeline integration | P1 |
| Award dialog | Captures contract details | Add award date/result document and duplicate safeguards | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Tender module exists but lacks preparation/follow-up/result workflow and mobile cards. |
| 02-dashboard-audit | Tender dashboard should expose action queues, not just aggregate KPIs. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 05-workflow | Tender stages and evidence requirements define first half of lifecycle. |
| 09-forms-data-capture | Tender form should become step-based with document/review support. |
| 10-deliverables-roadmap | Tender workspace and stage model are P0/P1 roadmap items. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/app/(dashboard)/tenders/overview/page.tsx
apps/tracker/src/app/(dashboard)/tenders/page.tsx
apps/tracker/src/components/tenders/tenders-table.tsx
apps/tracker/src/components/tenders/tender-form.tsx
apps/tracker/src/components/tenders/tender-details.tsx
apps/tracker/src/components/tenders/tender-to-project-dialog.tsx
apps/tracker/src/server/tenders.ts
apps/tracker/src/lib/validations/tender.ts
packages/db/src/schema.ts
```

### New Files Required

```text
apps/tracker/src/components/tenders/tender-stage-board.tsx
apps/tracker/src/components/tenders/tender-checklist.tsx
apps/tracker/src/components/tenders/follow-up-log.tsx
apps/tracker/src/components/tenders/tender-result-panel.tsx
```

### Database Changes

- [ ] Add tender `stage`, `priority`, `riskLevel`, `assignedTo`, `nextFollowUpAt`, `submittedAt`, `submissionProofDocumentId`, `resultReceivedAt`, `resultReason`.
- [ ] Add tender checklist/follow-up/activity tables or JSON-backed structured fields.

### API Changes

- [ ] Add follow-up CRUD, checklist CRUD, result capture, and submission proof actions.

---

## Open Questions

- [ ] What exact tender stages should be mandatory versus optional?
- [ ] Is “Appointed” the preferred business label over “Awarded”?
- [ ] Which documents are mandatory for every tender versus tender-specific?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- Cooperative dashboard heuristics for action-oriented tender overview: https://arxiv.org/abs/2308.04514
- W3C target size/reflow for mobile register usability: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
