## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 10-deliverables-roadmap.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Synthesis of all audit findings into recommendations, route/component plan, and phased roadmap |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md, 03-tender-management.md, 04-project-management.md, 05-workflow.md, 06-mobile-ux.md, 07-premium-ui.md, 08-navigation.md, 09-forms-data-capture.md |

---

## Executive Summary

Tracker has a solid technical foundation and enough current pages to evolve quickly, but the product is still closer to a CRUD admin system than a premium operational SaaS platform. The top priorities are: expose daily action queues, enrich tender lifecycle stages, build project detail into a delivery workspace, implement PO line item/partial delivery workflows, and create shared premium UI/mobile patterns. These changes should be phased so navigation/dashboard improvements create immediate usability gains while deeper workflow/data changes follow.

**Overall Score: 5.7/10**

| Area | Score | Trend |
|------|-------|-------|
| Current architecture | 7/10 | -> |
| Operational workflow | 5/10 | -> |
| Data capture | 5/10 | -> |
| Mobile readiness | 5/10 | -> |
| Premium SaaS readiness | 6/10 | -> |

---

## Current State

### What Exists Today

Tracker includes dashboards, tender overview/register/create/detail/edit, project overview/register/create/detail/edit, PO register/create/detail/edit, clients, calendar, reports, organizations, notifications, Better Auth roles, and a Drizzle schema covering tenders, projects, purchase orders, line items, delivery notes, documents, extensions, notifications, and org membership.

### Architecture Notes

The system is well-positioned for incremental improvement because server actions and validation schemas are centralized by domain. The largest gap is not framework choice; it is that the UI and server actions do not yet expose the richer lifecycle already implied by the DB and business requirements.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line items and partial deliveries are schema-only, not operational UI/server workflows. | PO schema/server/UI | Cannot accurately track outstanding delivery. | L |
| C2 | Tender workflow lacks explicit preparation/submission/follow-up/result states and evidence. | Tender schema/server/UI | Tender administrators cannot manage the full lifecycle reliably. | L |
| C3 | Project detail is not a project workspace. | `projects/[id]/page.tsx` | Users cannot see project delivery health in context. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Main dashboard lacks daily action queues and project/PO risk. | Dashboard | Users do not immediately know what to do. | M |
| M2 | Navigation hides important workflow queues. | Sidebar/routes | Users must hunt through registers. | M |
| M3 | Mobile tender and form workflows are weak. | Tender table/forms/details | Phone use is impractical for several core workflows. | M |
| M4 | Status design and labels are duplicated/inconsistent. | Multiple components | Lower clarity and polish. | S |
| M5 | Forms lack drafts, review steps, and transition-specific validation. | Tender/project/PO forms | Data quality and completion reliability suffer. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Several copy and naming details are generic or inconsistent. | Navigation/pages | Reduced domain confidence. | S |
| m2 | Browser-native alerts/confirms are used in places. | Detail pages | Less polished recovery and confirmation UX. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Fix incorrect tender status lookup**
   - What: Replace `won` with `awarded` in available tender query.
   - Where: `server/tenders.ts`
   - Expected outcome: Manual tender-to-project linking works.

2. **Centralize status UI maps**
   - What: Shared label/color/icon maps for tender/project/PO states.
   - Where: `lib/status-ui.ts`
   - Expected outcome: Consistent UI language.

3. **Add tender mobile cards**
   - What: Replace mobile horizontal scroll with cards.
   - Where: `TendersTable`
   - Expected outcome: Tender register usable on mobile.

### Short-Term (1-2 weeks)

1. **Launch dashboard action queues**
   - What: Closing today/week, briefings, follow-ups, missing documents, overdue POs.
   - Where: dashboard server/actions/components
   - Expected outcome: Login becomes operational.

2. **Upgrade navigation IA**
   - What: Add workflow links and module tabs for tenders/projects/POs.
   - Where: sidebar data and shared module nav
   - Expected outcome: Users can follow the lifecycle.

3. **Build project detail workspace**
   - What: Add PO summary, deliveries, documents, activity, risks, closeout.
   - Where: project detail components
   - Expected outcome: Project managers can manage delivery in one place.

### Medium-Term (1-3 months)

1. **Implement tender workflow workspace**
   - What: Stage pipeline, checklists, follow-ups, submission proof, result capture, award handoff.
   - Where: DB/server/tender components
   - Expected outcome: Full tender lifecycle.

2. **Implement PO line items and partial delivery**
   - What: Line item editor, delivery notes, delivered/outstanding quantities, completion guardrails.
   - Where: PO server/UI and schema migrations if needed
   - Expected outcome: Accurate fulfillment tracking.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Dashboard action queue | Missing | Role-based queue cards | P0 |
| Status badge | Duplicated maps | Shared semantic component | P0 |
| Tender pipeline | Coarse funnel | Stage board | P0 |
| Tender detail | Basic tabs | Workflow workspace | P0 |
| Project detail | Basic info | Project/PO/delivery workspace | P0 |
| PO detail | Header/status | Line items and delivery notes | P0 |
| Mobile register card | Partial | Shared card pattern across registers | P1 |
| Form stepper | Missing | Shared multi-step form pattern | P1 |
| Activity timeline | Partial | Shared domain event timeline | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Foundation exists but lifecycle and mobile gaps remain. |
| 02-dashboard-audit | Dashboard needs action queues and PO/project risk. |
| 03-tender-management | Tender needs stages, checklist, follow-up, proof, result. |
| 04-project-management | Project/PO needs workspace and partial delivery. |
| 05-workflow | End-to-end state transitions need evidence and automation. |
| 06-mobile-ux | Tender cards, filter drawers, sticky actions, stepped forms needed. |
| 07-premium-ui | Shared premium components and status system needed. |
| 08-navigation | IA should expose workflow queues and module tabs. |
| 09-forms-data-capture | Forms need transition-specific capture and validation. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| FINAL-REPORT | Use this roadmap as the implementation summary. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/app/(dashboard)/**
apps/tracker/src/components/dashboard/**
apps/tracker/src/components/tenders/**
apps/tracker/src/components/projects/**
apps/tracker/src/components/purchase-orders/**
apps/tracker/src/components/shared/**
apps/tracker/src/server/**
apps/tracker/src/lib/validations/**
packages/db/src/schema.ts
```

### New Files Required

```text
apps/tracker/src/lib/status-ui.ts
apps/tracker/src/lib/workflow.ts
apps/tracker/src/components/shared/mobile-action-bar.tsx
apps/tracker/src/components/shared/filter-drawer.tsx
apps/tracker/src/components/shared/workflow-timeline.tsx
apps/tracker/src/components/tenders/tender-stage-board.tsx
apps/tracker/src/components/tenders/tender-checklist.tsx
apps/tracker/src/components/tenders/follow-up-log.tsx
apps/tracker/src/components/purchase-orders/po-line-items-editor.tsx
apps/tracker/src/components/purchase-orders/delivery-note-form.tsx
```

### Database Changes

- [ ] Tender stage, priority, owner, follow-up, result, and evidence fields/tables.
- [ ] Workflow activity/event table.
- [ ] PO status expansion and delivery/line-item server constraints.
- [ ] Project risk/issues/closeout support.

### API Changes

- [ ] Dashboard queue endpoints.
- [ ] Transition-specific tender/project/PO server actions.
- [ ] PO line item and delivery note CRUD.

---

## Open Questions

- [ ] Confirm role-to-persona mapping.
- [ ] Confirm required evidence for submission, award, delivery, and project closeout.
- [ ] Confirm whether PO number uniqueness should be global or organization-scoped.

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- W3C WCAG 2.2 target size, reflow, labels, and error guidance: https://www.w3.org/WAI/WCAG22/
- Material Design 3 navigation guidance: https://m3.material.io/
- Cooperative dashboard design heuristics: https://arxiv.org/abs/2308.04514
