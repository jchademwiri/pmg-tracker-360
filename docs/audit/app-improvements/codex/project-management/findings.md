## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 04-project-management.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Project overview, register, detail page, purchase orders, and delivery tracking |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md |

---

## Executive Summary

Project Management has basic project and PO CRUD, mobile-friendly registers, and automatic project creation from awarded tenders. The core delivery workflow is incomplete: project details do not show PO or delivery health, PO line items are not captured in the UI, delivery notes and partial quantities are modeled but unused, and PO statuses are too simple for operational tracking. The priority is to turn project details into a delivery workspace and implement itemized PO fulfillment.

**Overall Score: 5.4/10**

| Area | Score | Trend |
|------|-------|-------|
| Project overview | 5/10 | -> |
| Project register | 7/10 | -> |
| Project detail | 4/10 | -> |
| PO management | 5/10 | -> |
| Partial delivery | 3/10 | -> |

---

## Current State

### What Exists Today

`/projects/overview` displays active projects, active POs, total PO amount, growth, and recent project/PO activity. `/projects` has search/filter/pagination and desktop/mobile layouts. `/projects/[id]` shows project info, client, linked tender, edit action, and timestamps. `/projects/purchase-orders` lists POs with search, status filter, desktop table, and mobile cards. `/projects/purchase-orders/[id]` shows PO details and status actions.

### Architecture Notes

Project schema includes tender link, client link, contract dates, award value, and signed contract URL, but project forms/details do not fully surface contract fields. PO schema includes total amount, expected delivery, delivered date, line items, delivery notes, and delivered quantities. Server/UI only use the PO header-level fields.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Partial delivery tables are unused in the Tracker server/UI. | `packages/db/src/schema.ts`, `server/purchase-orders.ts`, PO components | Users cannot track ordered, delivered, and outstanding quantities. | L |
| C2 | Project detail page does not include POs or delivery progress. | `projects/[id]/page.tsx` | Project health cannot be assessed from the project page. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | PO status model is limited to `open/sent/delivered`. | `PurchaseOrderCreateSchema`, `PODetails` | No Draft, Issued, Awaiting Delivery, Partially Delivered, Completed, On Hold, Disputed, Cancelled. | M |
| M2 | PO form captures a total amount and description, not itemized order lines. | `POForm` | Delivery progress cannot be reconciled by item. | L |
| M3 | Project overview lacks delayed/overdue/partially delivered metrics. | `projects/overview/page.tsx`, `getProjectStats` | Managers miss operational risk. | M |
| M4 | Project form does not capture contract dates/award value despite schema support. | `ProjectForm`, `project` schema | Awarded project context is incomplete for manual projects. | M |
| M5 | Completing project/PO has weak guardrails. | `PODetails`, project update actions | POs/projects can be marked complete without delivery evidence or outstanding checks. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | PO search does not include PO number despite placeholder saying it does. | `getPurchaseOrders` | Users may search a PO number and get no result. | S |
| m2 | PO number uniqueness is global, not organization-scoped. | `purchaseOrder.poNumber`, `server/purchase-orders.ts` | Could block legitimate duplicate external PO numbers across orgs. | S |
| m3 | Project list copy says “construction projects”. | `projects/page.tsx` | Domain mismatch for procurement/delivery platform. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Add PO number to search**
   - What: Include `poNumber` in `getPurchaseOrders` search OR update placeholder.
   - Where: `server/purchase-orders.ts`
   - Expected outcome: Search behaves as advertised.

2. **Show project POs on project detail**
   - What: Render filtered `POList` or a compact PO summary on `/projects/[id]`.
   - Where: `projects/[id]/page.tsx`, `POList`
   - Expected outcome: Project workspace shows delivery work in context.

### Short-Term (1-2 weeks)

1. **Expand project detail workspace**
   - What: Add tabs for overview, POs, deliveries, documents, activity, risks/issues.
   - Where: project detail page and new components
   - Expected outcome: Users manage projects without jumping across global registers.

2. **Upgrade PO statuses**
   - What: Add Draft, Issued, Awaiting Delivery, Partially Delivered, Delivered, Completed, Cancelled, Disputed/On Hold.
   - Where: validation, status UI maps, PO list/detail, migrations if constrained
   - Expected outcome: PO state reflects actual fulfillment.

### Medium-Term (1-3 months)

1. **Implement itemized delivery tracking**
   - What: Build line item editor, delivery note capture, quantity delivered validation, outstanding quantity calculations, delivery progress bars.
   - Where: PO form/detail/server actions
   - Expected outcome: Full partial delivery support.

2. **Add project closeout rules**
   - What: Prevent project completion until open POs, disputed deliveries, and required documents are resolved.
   - Where: project status action/server validation
   - Expected outcome: Reliable closeout and reporting.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Project overview | Basic stats/activity | Delivery risk dashboard | P1 |
| Project register | Table plus mobile cards | Add PO/delivery indicators | P1 |
| Project detail | Basic info | Full project workspace | P0 |
| PO list | Table/mobile cards | Add overdue/partial/outstanding badges | P0 |
| PO form | Header-only form | Header + line items + review | P0 |
| PO detail | Header/status only | Line items, delivery notes, outstanding quantities | P0 |
| Delivery capture | Missing from UI | Delivery note and item quantity form | P0 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | DB has partial delivery tables but app does not implement them. |
| 02-dashboard-audit | Main dashboard lacks project/PO delivery health. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 05-workflow | Delivery and completion steps are missing in UI despite schema. |
| 09-forms-data-capture | PO form needs line items, delivery notes, and completion review. |
| 10-deliverables-roadmap | Project workspace and PO partial delivery are high-priority phases. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/app/(dashboard)/projects/overview/page.tsx
apps/tracker/src/app/(dashboard)/projects/[id]/page.tsx
apps/tracker/src/components/projects/project-form.tsx
apps/tracker/src/components/purchase-orders/po-list.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/server/projects.ts
apps/tracker/src/server/purchase-orders.ts
apps/tracker/src/lib/validations/project.ts
apps/tracker/src/lib/validations/purchase-order.ts
packages/db/src/schema.ts
```

### New Files Required

```text
apps/tracker/src/components/projects/project-detail-workspace.tsx
apps/tracker/src/components/projects/project-po-summary.tsx
apps/tracker/src/components/purchase-orders/po-line-items-editor.tsx
apps/tracker/src/components/purchase-orders/delivery-note-form.tsx
apps/tracker/src/components/purchase-orders/delivery-progress.tsx
```

### Database Changes

- [ ] Add PO status values and possibly organization-scoped unique index for PO number.
- [ ] Add project risk/issues/activity fields or tables.
- [ ] Ensure delivery note/item tables have server-supported constraints for over-delivery prevention.

### API Changes

- [ ] Add line item CRUD, delivery note CRUD, delivered quantity aggregation, and completion actions.

---

## Open Questions

- [ ] Should POs represent customer purchase orders, supplier purchase orders, or both?
- [ ] Should invoice tracking be part of Phase 1 PO delivery or later finance work?
- [ ] Who can confirm delivery and mark PO complete?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- W3C target size minimum for mobile PO actions: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Cooperative dashboard heuristics for project/PO health dashboards: https://arxiv.org/abs/2308.04514
