## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 01-codebase-audit.md |
| **Date** | 2026-06-14 |
| **Auditor** | Codex |
| **Scope** | Full Tracker app codebase, shared DB schema, shared UI primitives, routes, workflow, mobile, and visual audit |
| **Depends On** | None |

---

## Executive Summary

The Tracker app is a Next.js App Router application inside a Bun/Turborepo workspace, with a credible foundation for tender, project, PO, document, notification, and organization management. The largest issue is not lack of pages, but an incomplete operational lifecycle: statuses are coarse, multiple DB capabilities are not surfaced, tender preparation/follow-up/result workflows are mostly absent, and PO partial delivery is modeled but unused in the app. The UI is serviceable and componentized, but still reads as a basic admin tool in places and is inconsistent on mobile, especially tender tables and detail pages.

**Overall Score: 5.8/10**

| Area | Score | Trend |
|------|-------|-------|
| Architecture foundation | 7/10 | -> |
| Workflow coverage | 5/10 | -> |
| Mobile usability | 5/10 | -> |
| Visual polish | 6/10 | -> |
| Data model fit | 6/10 | -> |

---

## Current State

### What Exists Today

The monorepo has `apps/tracker`, `packages/db`, and `packages/ui`. Tracker uses Next.js App Router, React 19, Tailwind/shadcn-style primitives, Better Auth, Drizzle/Postgres, Recharts, FullCalendar, and server actions. Dashboard routes sit under `apps/tracker/src/app/(dashboard)`.

Key Tracker routes include `/dashboard`, `/calendar`, `/reports`, `/clients`, `/tenders/overview`, `/tenders`, `/tenders/create`, `/tenders/[id]`, `/tenders/[id]/edit`, `/projects/overview`, `/projects`, `/projects/create`, `/projects/[id]`, `/projects/[id]/edit`, `/projects/purchase-orders`, `/projects/purchase-orders/create`, `/projects/purchase-orders/[id]`, and `/projects/purchase-orders/[id]/edit`.

### Architecture Notes

Shared DB schema lives in `packages/db/src/schema.ts`. Tracker has local UI primitives in `apps/tracker/src/components/ui` plus shared primitives in `packages/ui`. Navigation is driven by `apps/tracker/src/data/dashboad-links.ts` and rendered by `AppSidebar`, `NavMain`, `SidebarProvider`, and breadcrumb components. Server data access lives mostly in `apps/tracker/src/server/*.ts`; form validation lives in `apps/tracker/src/lib/validations/*.ts`.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line items, delivery notes, and delivered quantities exist in schema but are not implemented in server actions or UI. | `packages/db/src/schema.ts`, `apps/tracker/src/server/purchase-orders.ts`, `apps/tracker/src/components/purchase-orders/*` | Partial delivery, outstanding quantity, and completion accuracy cannot be operated from the app. | L |
| C2 | Manual project creation searches for tender status `won`, but the app uses `awarded`. | `apps/tracker/src/server/tenders.ts` `getAvailableTendersForProjects` | Awarded tenders may not appear as available for project creation, breaking manual tender-to-project flow. | S |
| C3 | Tender document upload is shown as unavailable even though document server/schema support exists. | `TenderForm`, `TenderDetails`, `DocumentManager`, `server/documents.ts` | Users cannot reliably attach tender packs, proof of submission, contracts, or delivery evidence from the visible workflow. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender statuses are too coarse for the requested workflow. | `TenderCreateSchema`, `TenderDetails`, `TendersOverviewPage` | No clear separation between opportunity review, preparation, ready for submission, submitted, awaiting result, awarded, lost, cancelled. | M |
| M2 | Project detail page does not show POs, delivery progress, contract dates, risks, documents, or closeout state. | `apps/tracker/src/app/(dashboard)/projects/[id]/page.tsx` | Project users must leave the project context to understand delivery health. | M |
| M3 | Main dashboard lacks operational queues: follow-ups due, missing compliance, delayed POs, overdue deliveries, and assigned work. | `DashboardPage`, `AdminView`, `SpecialistView`, `server/dashboard.ts` | Users do not immediately know what to do next after login. | M |
| M4 | Tender register uses horizontal table scrolling rather than a mobile card layout. | `TendersTable` | Mobile users must pan dense tables; high-risk deadlines and actions are harder to scan. | M |
| M5 | Workflow changes rely on status buttons without guardrails or required evidence. | `TenderDetails`, `PODetails` | Users can mark awarded/submitted/delivered without proof, checklist completion, or delivery details. | M |
| M6 | Search/count queries count rows by array length of selected rows, not database aggregate count. | `server/tenders.ts`, `server/projects.ts`, `server/purchase-orders.ts` | Pagination totals can be wrong for larger datasets. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Navigation data file is misspelled `dashboad-links.ts`. | `apps/tracker/src/data/dashboad-links.ts` | Small maintainability and discoverability issue. | S |
| m2 | Mixed status color semantics appear across tender overview/table/detail. | `tenders-table.tsx`, `tender-details.tsx`, `tenders/overview/page.tsx` | Users may learn inconsistent meaning for the same state. | S |
| m3 | Several delete/status operations use `confirm`/`alert` rather than consistent dialogs/toasts. | Tender and PO details | Feels unpolished and gives weak error recovery. | S |
| m4 | Some copy is domain-mismatched, e.g. “construction projects”. | `projects/page.tsx` | Reduces fit for PMG’s procurement/delivery context. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Fix awarded tender lookup**
   - What: Replace `eq(tender.status, 'won')` with `eq(tender.status, 'awarded')`.
   - Where: `apps/tracker/src/server/tenders.ts`
   - Expected outcome: Manual project creation can find awarded tenders.

2. **Normalize status labels and colors**
   - What: Create shared tender/project/PO status maps.
   - Where: `apps/tracker/src/lib/status-ui.ts`, tender/project/PO components
   - Expected outcome: Consistent recognition across registers and details.

3. **Expose mobile tender cards**
   - What: Add `md:hidden` tender cards mirroring project/PO list behavior.
   - Where: `TendersTable`
   - Expected outcome: Mobile tender management becomes practical.

### Short-Term (1-2 weeks)

1. **Upgrade main dashboard into role-based work queues**
   - What: Add “needs action today”, follow-ups due, closing soon, briefing sessions, missing documents, delayed POs.
   - Where: `server/dashboard.ts`, `components/dashboard/*`
   - Expected outcome: Users know the next action immediately.

2. **Build project workspace detail**
   - What: Add tabs/sections for POs, delivery progress, linked tender, documents, risks, activity, and closeout.
   - Where: `projects/[id]/page.tsx`, new project detail components
   - Expected outcome: Projects become operational hubs.

### Medium-Term (1-3 months)

1. **Implement PO item and delivery note workflow**
   - What: Add server actions and UI for line items, delivery notes, delivered quantities, outstanding quantities, disputes, and completion.
   - Where: `server/purchase-orders.ts`, PO form/detail components, DB migrations if status values change
   - Expected outcome: Full partial delivery tracking.

2. **Add tender preparation lifecycle**
   - What: Add stages, checklists, assigned owners, follow-up logs, extension/result history, proof of submission, and award conversion guardrails.
   - Where: DB schema, tender server actions, tender detail/form components
   - Expected outcome: Complete tender-to-project lifecycle coverage.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| Dashboard metric cards | Useful aggregate metrics | Add role-sensitive operational queues and risk cards | P0 |
| Tender overview | Has KPI cards, status browse, funnel, deadlines | Add pipeline stages, follow-ups, documents, briefing attendance, risk | P0 |
| Tender register | Table with filters and horizontal scroll | Desktop table plus mobile cards, deadline/risk badges, bulk actions | P0 |
| Tender detail | Overview/documents/extensions tabs; status buttons | Workflow workspace with checklist, logs, proof, result, conversion | P0 |
| Project overview | Basic stats and activity | Add PO delivery health, overdue deliveries, pending PO value | P1 |
| Project register | Table plus mobile cards | Add PO status and delivery progress indicators | P1 |
| Project detail | Basic info only | Full project workspace with PO summary, delivery progress, closeout | P0 |
| PO list | Table plus mobile cards | Add overdue/partial/outstanding indicators | P0 |
| PO detail | Basic info and status buttons | Add line items, delivery notes, partial delivery capture, invoices | P0 |
| Forms | Single long forms | Multi-step forms, save draft, review screens, contextual validation | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| None | Foundational audit |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 02-dashboard-audit | Dashboard needs work queues, risk, and project/PO visibility. |
| 03-tender-management | Tender lifecycle needs finer stages, checklists, follow-ups, documents, result handling. |
| 04-project-management | Project/PO experience needs itemized delivery tracking and project workspace detail. |
| 06-mobile-ux | Tender register/detail and forms need mobile-specific layouts. |
| 07-premium-ui | UI needs shared status system, stronger hierarchy, less admin-panel feel. |
| 08-navigation | Sidebar lacks workflow links for follow-ups, awarded tenders, deliveries, overdue items. |
| 09-forms-data-capture | Forms need better validation, drafts, stepper patterns, and evidence capture. |

---

## Implementation Notes

### Affected Files

```text
apps/tracker/src/app/(dashboard)/dashboard/page.tsx
apps/tracker/src/app/(dashboard)/tenders/*
apps/tracker/src/app/(dashboard)/projects/*
apps/tracker/src/components/dashboard/*
apps/tracker/src/components/tenders/*
apps/tracker/src/components/projects/*
apps/tracker/src/components/purchase-orders/*
apps/tracker/src/server/tenders.ts
apps/tracker/src/server/projects.ts
apps/tracker/src/server/purchase-orders.ts
apps/tracker/src/lib/validations/*
packages/db/src/schema.ts
```

### New Files Required

```text
apps/tracker/src/lib/status-ui.ts
apps/tracker/src/components/shared/register-mobile-card.tsx
apps/tracker/src/components/shared/workflow-timeline.tsx
apps/tracker/src/components/tenders/tender-checklist.tsx
apps/tracker/src/components/tenders/follow-up-log.tsx
apps/tracker/src/components/purchase-orders/po-line-items-editor.tsx
apps/tracker/src/components/purchase-orders/delivery-note-form.tsx
```

### Database Changes

- [ ] Add tender stage/priority/risk/owner/follow-up/result/proof fields or related tables.
- [ ] Add workflow activity log table for tender/project/PO events.
- [ ] Consider enum-like constrained statuses or lookup tables for tender/project/PO states.
- [ ] Add indexes for dashboard queues and date-driven alerts.

### API Changes

- [ ] Add tender follow-up, result, checklist, and proof-of-submission actions.
- [ ] Add PO line item, delivery note, and delivery quantity actions.
- [ ] Add dashboard queue endpoints for role-specific operational tasks.

---

## Open Questions

- [ ] Which roles map to tender administrator, manager/owner, and general user in the current Better Auth role model?
- [ ] Should PO numbers be globally unique as implemented, or unique per organization/client/project?
- [ ] Are attachments required to be stored in S3 for tender packs, signed contracts, delivery notes, and invoices?
- [ ] Should tender/project statuses become strict DB enums or remain text with application constraints?

---

## Appendix

### Screenshots / Visual References

Not captured in this audit pass.

### Research Sources

- W3C WCAG 2.2 Target Size Minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C WCAG 2.2 Error Identification: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- W3C WCAG 2.2 Error Suggestion: https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
- Material Design 3 navigation drawer/bar guidelines: https://m3.material.io/components/navigation-drawer/guidelines and https://m3.material.io/components/navigation-bar/guidelines
- Setlur, Correll, Satyanarayan, Tory, “Heuristics for Supporting Cooperative Dashboard Design”: https://arxiv.org/abs/2308.04514
