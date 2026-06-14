# Findings: Project Management Mini Dashboard

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 04-project-management.md |
| **Date** | 2026-06-14 |
| **Auditor** | Buffy (AI Audit) |
| **Scope** | Project mini dashboard, register, detail page, and PO management |
| **Depends On** | 01-codebase-audit, 02-dashboard-audit |

---

## Executive Summary

The project management area has basic CRUD functionality but lacks operational depth. Projects can be created manually or from awarded tenders, but there is no progress tracking, no project phases, and limited PO management. The PO status enum is too restricted (open/sent/delivered) and partial delivery recording has no UI despite schema support. The project detail page is functional but sparse.

**Overall Score: 4/10**

| Area | Score | Trend |
|------|-------|-------|
| Project Overview | 4/10 | → |
| Project Register | 4/10 | → |
| Project Detail | 3/10 | ↓ |
| PO Management | 3/10 | ↓ |
| Delivery Tracking | 2/10 | ↓ |
| Progress Visibility | 2/10 | ↓ |

---

## Current State

### Project Overview (`/projects/overview`)
- Basic page with project listing
- No KPI cards or summary metrics
- No project health indicators

### Project Register (`/projects`)
- `ProjectList` with basic table
- Columns: Project Number, Description, Client, Status, Created
- Minimal search and filtering

### Project Detail (`/projects/[id]`)
- `ProjectForm` in detail mode
- Shows: Project number, description, client, status, contract dates, award value
- Links to POs
- Basic document area

### PO Management (`/projects/purchase-orders`)
- `POList` — PO register with basic table
- `POForm` — Create/edit PO with line items
- `PODetails` — PO detail with line items and delivery notes
- PO statuses: open, sent, delivered (very limited)
- Delivery notes exist in schema but UI is minimal

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO status enum is too limited — no draft, partially_delivered, completed, cancelled | `schema.ts` | Cannot accurately track PO lifecycle | S |
| C2 | No partial delivery recording UI — schema supports it but UI doesn't expose it | `po-details.tsx` | Cannot track partial deliveries operationally | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | No project progress tracking — no percentage, phases, or milestones | `schema.ts`, `project-detail` | Cannot see project health at a glance | M |
| M2 | Project overview has no KPI cards — no summary metrics | `projects/overview/page.tsx` | Must scroll to understand project status | M |
| M3 | No project-to-PO summary — cannot see total PO value vs project value | `project-detail` | Cannot assess financial health | M |
| M4 | PO form doesn't support draft saving | `po-form.tsx` | Complex POs must be completed in one sitting | M |
| M5 | No delivery progress tracking per line item | `po-details.tsx` | Cannot see which items are delivered vs pending | M |
| M6 | No project completion workflow — status change only | `project-form.tsx` | No formal close-out process | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Project register has minimal search — no client or status filter | `project-list.tsx` | Hard to find specific projects | S |
| m2 | No project timeline view | — | Cannot see project chronology | S |
| m3 | PO delivery notes don't show line item details | `po-details.tsx` | Unclear what was delivered | S |
| m4 | No export functionality for project or PO data | — | Cannot generate reports | S |
| m5 | Contract dates have no visual indicator when overdue | `project-detail` | Missed contract deadlines | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Expand PO status enum**
   - What: Add draft, partially_delivered, completed, cancelled, disputed statuses
   - Where: `schema.ts`, migration, all PO components
   - Expected outcome: Accurate PO lifecycle tracking

2. **Add KPI cards to project overview**
   - What: Show Total Active, Delayed, Awaiting PO, Open POs, Completed This Month
   - Where: New `ProjectOverviewMetrics` component
   - Expected outcome: Instant project health visibility

3. **Add contract deadline indicators**
   - What: Show visual warning when contract end date is approaching or past
   - Where: `project-detail` components
   - Expected outcome: Proactive deadline management

### Short-Term (1-2 weeks)

1. **Implement partial delivery recording UI**
   - What: Add UI to record delivery per line item with quantity delivered
   - Where: New `PartialDeliveryForm` component, update `po-details.tsx`
   - Expected outcome: Track partial deliveries operationally

2. **Add project progress tracking**
   - What: Add progress percentage field and visual indicator
   - Where: `schema.ts`, migration, project detail components
   - Expected outcome: Visible project health

3. **Implement PO draft saving**
   - What: Allow saving POs as draft before final submission
   - Where: `po-form.tsx`, `po-list.tsx`
   - Expected outcome: Complex POs can be built incrementally

### Medium-Term (1-3 months)

1. **Build project phases/milestones**
   - What: Define project phases (Planning, Execution, Delivery, Close-out) with milestones
   - Where: New `projectPhase` table, phase tracking components
   - Expected outcome: Structured project lifecycle management

2. **Add financial dashboard per project**
   - What: Show PO value vs project value, budget utilisation, delivery status
   - Where: New financial components, server functions
   - Expected outcome: Financial visibility per project

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| ProjectOverviewMetrics | Non-existent | KPI cards with project stats | P0 |
| PartialDeliveryForm | Non-existent | UI for recording partial deliveries | P0 |
| ProjectProgressIndicator | Non-existent | Visual progress bar or ring | P1 |
| ProjectTimeline | Non-existent | Chronological project view | P2 |
| FinancialDashboard | Non-existent | PO vs project value comparison | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit | Project CRUD exists; PO limited by status enum; delivery notes exist but no UI |
| 02-dashboard-audit | Dashboard metrics pattern to extend for project overview |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 05-workflow | Project completion workflow missing; PO lifecycle gaps |
| 09-forms-data-capture | PO form needs draft saving; delivery recording needs multi-step |
| 10-deliverables-roadmap | PO status expansion and delivery UI are foundational |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/projects/project-list.tsx
apps/tracker/src/components/projects/project-form.tsx
apps/tracker/src/components/projects/project-create-dialog.tsx
apps/tracker/src/components/purchase-orders/po-list.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/app/(dashboard)/projects/overview/page.tsx
packages/db/src/schema.ts
```

### New Files Required

```
components/projects/project-overview-metrics.tsx
components/projects/project-progress-indicator.tsx
components/purchase-orders/partial-delivery-form.tsx
components/purchase-orders/delivery-progress.tsx
```

### Database Changes

- [ ] Expand `purchase_order.status` enum values
- [ ] Add `progress` field to project table
- [ ] Add `notes` field to purchase order for draft saving

### API Changes

- [ ] Add `recordPartialDelivery()` server function
- [ ] Update `getProjectStats()` to include PO value summaries
- [ ] Add `savePODraft()` server function

---

## Open Questions

- [ ] Should project phases be configurable per organisation?
- [ ] Should partial deliveries trigger notifications?
- [ ] Is budget tracking a priority?
