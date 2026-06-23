# Combined App Improvements Audit Report

Date: 2026-06-14  
Models compared: Antigravity, codebuff, codex  
Scope: Cross-model reconciliation of 10 independent Tracker app audit areas

## Executive Summary

The three model audits agree on the core diagnosis: PMG Tracker 360 has a solid technical foundation, but the Tracker app is not yet a complete operational SaaS workflow. The highest-confidence issues are not cosmetic. They are missing workflow capabilities: PO line items and partial delivery, tender follow-up/result/evidence capture, project detail workspace, dashboard action queues, mobile tender usability, navigation urgency, and shared status/design patterns.

**Overall reconciled score: 5.4/10**  
**Overall confidence: High for workflow gaps, Medium for visual/mobile scoring**

Average scores by area:

| Area | Avg Score | Confidence |
|------|-----------|------------|
| Codebase audit | 5.8/10 | High |
| Dashboard audit | 5.8/10 | High |
| Tender management | 6.1/10 | Medium |
| Project management | 4.5/10 | High |
| Workflow | 5.0/10 | High |
| Mobile UX | 4.8/10 | Medium |
| Premium UI | 6.2/10 | Medium |
| Navigation | 6.0/10 | High |
| Forms/data capture | 5.0/10 | High |
| Deliverables roadmap | 5.7/10 | Medium |

## Cross-Model Agreement Matrix

| Issue | Antigravity | codebuff | codex | Confidence |
|-------|-------------|----------|-------|------------|
| PO line items and delivery notes are not operationally implemented | Yes | Yes | Yes | High |
| Partial delivery/outstanding quantity tracking is missing | Yes | Yes | Yes | High |
| PO status model is too limited | Yes | Yes | Yes | High |
| Project detail lacks PO/delivery workspace | Yes | Yes | Yes | High |
| Dashboard lacks action queues/urgent work | Yes | Yes | Yes | High |
| Navigation lacks badge counts/urgency | Yes | Yes | Yes | High |
| Command palette is missing | Yes | Yes | Yes | Medium |
| Tender follow-up/result workflow is missing | Partial | Yes | Yes | High |
| Tender-to-project `won` vs `awarded` issue | Yes | Not central | Yes | High after code verification |
| Document/proof upload is disabled/unavailable | Not central | Yes | Yes | High |
| Mobile registers need card layouts | Yes | Yes | Yes | High, with scope caveat |
| Complex forms need stepper/draft support | Yes | Yes | Yes | High |
| Shared status/design system is needed | Yes | Yes | Yes | High |
| Premium UI needs stronger hierarchy | Yes | Yes | Yes | Medium |
| Activity log/workflow timeline is missing | Partial | Yes | Yes | Medium |

## Combined Top 10 Priorities

1. **Implement PO line items and partial delivery tracking**  
   Highest confidence. All models flag this as the largest post-award workflow gap.

2. **Fix awarded tender availability/status mismatch**  
   Small effort, high impact. Fix `won` vs `awarded` in tender/project handoff.

3. **Enable document/proof upload in tender workflows**  
   Required for tender packs, submission proof, award evidence, and compliance.

4. **Add tender follow-up and result capture**  
   Persist follow-ups, next follow-up date, result details, award/loss reasons, and result documents.

5. **Build project detail as a project workspace**  
   Add linked POs, delivery progress, contract details, documents, activity, risks, and closeout.

6. **Add dashboard action queues**  
   Closing today/week, briefings, follow-ups, missing documents, overdue POs, delayed deliveries.

7. **Add navigation badge counts and workflow links**  
   Expose follow-ups, submitted/awarded tenders, deliveries, overdue items, and reports.

8. **Add tender mobile cards and mobile filter drawers**  
   Tender register is the most consistently flagged mobile gap.

9. **Create shared status/design system components**  
   `StatusBadge`, status maps, card variants, empty states, timeline, checklist, progress cards.

10. **Convert complex forms to stepper/draft workflows**  
   Start with tender form and PO delivery capture; add autosave/draft support.

## Combined Implementation Roadmap

### Phase 1: Stabilize Core Handoff and UI Language

- Fix `won` vs `awarded`.
- Add shared status maps and `StatusBadge`.
- Replace native confirms/alerts with app dialogs.
- Add PO number search correctness.
- Re-enable document upload where server support already exists.

### Phase 2: Dashboard and Navigation Actionability

- Add dashboard action queue band.
- Add project/PO risk cards.
- Add nav badge counts for urgent queues.
- Rename navigation groups to match business modules.
- Add direct links for follow-ups, awarded/submitted tenders, deliveries, overdue items.

### Phase 3: Tender Workflow Workspace

- Add tender stages and readiness workflow.
- Persist follow-ups and next follow-up date.
- Add result capture dialog/form.
- Add tender checklist tied to uploaded documents.
- Add tender mobile cards and filtered queues.

### Phase 4: Project Workspace

- Add POs to project detail.
- Add contract and linked tender summaries.
- Add project delivery/risk overview.
- Add activity timeline and documents.
- Add awaiting-PO and delayed-project queues.

### Phase 5: PO Line Items and Delivery Tracking

- Add PO line-item editor and server CRUD.
- Expand PO status model.
- Add delivery note capture with POD upload.
- Validate delivered quantities against outstanding quantities.
- Auto-calculate delivered, partially delivered, completed, and outstanding states.

### Phase 6: Mobile and Form System

- Add shared mobile card patterns.
- Add filter drawer/bottom sheet.
- Add sticky mobile action bars.
- Convert tender/PO forms to steppers.
- Add draft/autosave support.

### Phase 7: Automation, Reporting, and Activity

- Add workflow activity/event table.
- Add notification triggers for deadline/follow-up/delivery risks.
- Add project closeout workflow.
- Add reporting for win/loss, delivery performance, overdue POs, and workload.
- Add command palette and recent items.

## Model Strengths

**Antigravity**

Best at identifying concrete code-level blockers and architecture positives. It strongly surfaced the `won` vs `awarded` bug, missing PO line items/delivery notes, RBAC concerns for members, and the stronger parts of the current design/theme foundation.

**codebuff**

Best at strict UX/product critique. It consistently caught missing persistence, disabled document upload, draft saving, mobile pain, visual hierarchy gaps, badge counts, and operational workflow gaps. Some findings overgeneralized current mobile table behavior, so its mobile severity should be verified route by route.

**codex**

Best at reconciling implementation detail with product workflow. It distinguished existing mobile cards from missing tender cards, tied schema capabilities to UI/server gaps, identified project workspace needs, and framed implementation around workflow states, evidence, and guardrails.

## Recommended Next Steps

1. Run a short code verification pass on five items before implementation: `won` vs `awarded`, document upload availability, PO line-item UI absence, project/PO mobile cards, and current permissions for `member` PO access.
2. Implement Phase 1 quick wins as a single stabilization sprint.
3. Create the shared `StatusBadge`/status map before changing dashboard, navigation, register, and detail UI.
4. Build dashboard queues and navigation badge counts next; this gives immediate product value while deeper workflow work proceeds.
5. Treat PO line items plus delivery notes as the largest backend/UI feature package and plan it as a dedicated phase.
6. Do not start with cosmetic redesign. Build premium UI through operational components: queues, timelines, checklists, progress cards, mobile cards, and delivery forms.

## Open Decisions

- Which Better Auth roles map to tender administrator, manager/owner, general user, and field receiver?
- Should PO numbers be globally unique or organization-scoped?
- Which tender/project/PO transitions require proof documents?
- Should tender stages and PO statuses be DB enums, lookup rows, or app-controlled text?
- Is offline/mobile delivery capture required for field workflows?

