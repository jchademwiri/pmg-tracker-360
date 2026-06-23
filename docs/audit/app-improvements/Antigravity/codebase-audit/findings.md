# Findings – 01-codebase-audit.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 01-codebase-audit.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Detailed audit of the PMG Tracker 360 monorepo codebase structure, routes, schemas, and UX gaps. |
| **Depends On** | None (Phase 1) |

---

## Executive Summary

The **PMG Tracker 360** codebase has a strong modern foundation, utilizing a Next.js App Router for the **Tracker** app, Drizzle ORM with PostgreSQL for data persistence, Better Auth for authentication/RBAC, and Tailwind CSS v4 with Shadcn for styling. 

However, there is a critical functional gap in the tender-to-project lifecycle: the backend expects a status of `'won'` to list tenders eligible for conversion, but the application and schema write and validate the status as `'awarded'`. Furthermore, the purchase order line items and partial delivery tracking systems defined in the database schema are entirely unimplemented in the frontend and API layers, leaving project delivery management non-functional.

**Overall Score: 6.5/10**

| Area | Score | Trend |
|------|-------|-------|
| Codebase Structure & Routing | 8.5/10 | ↑ |
| Database Schema & Data Model | 7.5/10 | → |
| Tender Management | 8.0/10 | ↑ |
| Project & PO Management | 4.0/10 | ↓ |
| Mobile Responsiveness | 6.0/10 | → |
| Visual Design & Polish | 7.0/10 | → |

---

## Current State

### What Exists Today

1. **Monorepo Architecture (Turborepo):**
   - **`apps/tracker`**: Next.js App Router workspace representing the core SaaS platform.
   - **`apps/admin`**: Next.js App Router workspace representing the administrator management panel.
   - **`packages/db`**: Shared database package containing the Drizzle schema (`packages/db/src/schema.ts`) and migrations.
   - **`packages/ui`**: Shared UI component package containing basic Radix/Shadcn primitives (`avatar`, `badge`, `button`, etc.).

2. **Routing Structure in Tracker (`apps/tracker/src/app`):**
   - **`/dashboard`**: Layout wrapper routing to `AdminView` (for owners/admins/managers) or `SpecialistView` (for members).
   - **`/tenders`**: Register table of tenders with client-side searching/filtering (`overview/client-wrapper.tsx`).
   - **`/tenders/[id]`**: Tender detail page with tabs for info, document checklist, and extensions.
   - **`/projects`**: Simple register list of projects.
   - **`/projects/[id]`**: Project details showing metadata, client info, and linked tender.
   - **`/projects/purchase-orders`**: Purchase Order register.
   - **`/projects/purchase-orders/[id]`**: Basic details of a single PO with simple status toggles.

3. **Authentication & Authorization:**
   - Better Auth with magic link and email/password support.
   - Core organization plugin enabled, providing multi-tenancy.
   - Role-Based Access Control (RBAC) in `apps/tracker/src/lib/auth/permissions.ts` defining distinct levels (`owner`, `admin`, `manager`, `member`).

### Architecture Notes

- **Data Fetching**: Next.js Server Components load data using asynchronous server actions (e.g., `getTendersOverview`, `getProjects`) which execute raw SQL queries through Drizzle.
- **Client/Server Boundary**: High-interaction pages use Client Components (marked `'use client'`) and receive server data through props, synchronizing filters via browser query parameters.
- **RBAC Enforcement**: The frontend sidebar hides certain links based on role (e.g., hiding Purchase Orders for members), while backend server actions verify permissions explicitly using `auth.api.hasPermission` with the request headers.

---

## Findings

### Critical Issues

> Issues that block core functionality or cause data loss.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | **Tender-to-Project Conversion Blocked** (Status Mismatch) | `src/server/tenders.ts#L897` | `getAvailableTendersForProjects` queries for tenders with `status = 'won'`. However, the Zod schema and DB models restrict status updates to `'awarded'`. No tenders ever appear for conversion, blocking project creation. | S |
| C2 | **Line Items & Deliveries Unimplemented** | `src/server/purchase-orders.ts`, `components/purchase-orders/` | The database tables for PO line items, delivery notes, and delivery items exist, but there is no CRUD API, server actions, or UI to read, write, or track them. | L |

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **Incomplete Project Detail View** | `src/app/(dashboard)/projects/[id]/page.tsx` | The project view lacks contract timelines, financial stats, and a list of linked Purchase Orders, preventing managers from monitoring project health. | M |
| M2 | **Incomplete PO Detail View** | `src/components/purchase-orders/po-details.tsx` | The PO view only shows basic metadata and simple status buttons. It does not show PO items or delivery note histories. | M |
| M3 | **Member Role Over-Restriction** | `src/lib/auth/permissions.ts#L84` | The `member` role has zero permissions for `purchase_order` and is hidden from the menu, which conflicts with standard users needing to view deliveries and record receiving tasks. | S |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Duplicate UI Components** | `packages/ui/src/` vs `apps/tracker/src/components/ui/` | Primitives like `button.tsx` and `card.tsx` are duplicated across packages, risking design drift. | M |
| m2 | **Inconsistent Confirmation UI** | `client-wrapper.tsx#L150`, `po-details.tsx#L78` | Relies on browser-native `window.confirm()`, breaking the premium custom-designed layout. | S |
| m3 | **Static Dashboard Widgets** | `specialist-view.tsx` | Metric cards and lists are static and lack real-time interactive filtering or drill-downs. | M |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Fix Tender Status Mismatch (C1)**
   - **What**: Change the query in `getAvailableTendersForProjects` to check for status `'awarded'` instead of `'won'`.
   - **Where**: `apps/tracker/src/server/tenders.ts#L897`
   - **Expected outcome**: Users can select awarded tenders when creating a project.

2. **Replace Native Dialogs with Radix Alert (m2)**
   - **What**: Replace `window.confirm` with the custom `@/components/ui/alert-dialog` component.
   - **Where**: `tenders/overview/client-wrapper.tsx` and `purchase-orders/po-details.tsx`
   - **Expected outcome**: Polished, theme-matching confirm modals.

### Short-Term (1-2 weeks)

1. **Implement PO Line Items CRUD & Table**
   - **What**: Build server actions to create/fetch line items. Add a dynamic table in `po-details.tsx` displaying lines with Description, Qty, Unit Price, and Subtotal.
   - **Where**: `src/server/purchase-orders.ts`, `src/components/purchase-orders/po-details.tsx`
   - **Expected outcome**: Users can see what was ordered in a PO.

2. **Add PO List to Project Detail Page**
   - **What**: Query all POs linked to the project and render them as a card list or table on the project detail page.
   - **Where**: `src/app/(dashboard)/projects/[id]/page.tsx`
   - **Expected outcome**: Complete financial tracking visibility for managers under each project.

### Medium-Term (1-3 months)

1. **Build Partial Delivery Tracking Module**
   - **What**: Implement Delivery Note creation (upload PDF, enter delivery note number, record quantities received for each line item) and update PO status dynamically to "partially delivered" or "completed".
   - **Where**: `src/server/purchase-orders.ts`, new components in `components/purchase-orders/`
   - **Expected outcome**: Real-time receipt tracking for site inventory managers.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **Project Details (`[id]/page.tsx`)** | Shows basic metadata and client details. | Add interactive financial cards, contract milestone calendar, and PO tracking table. | P0 |
| **PO Details (`po-details.tsx`)** | Shows metadata and simple status updates. | Add PO Line Items table and Delivery Note receipt tab. | P0 |
| **Tender-to-Project Dialog** | Basic modal converting won tenders. | Pre-populate client details and award value, resolving won status. | P1 |
| **Dashboard Metrics** | Shows simple counts. | Implement interactive cards with sparklines and quick filters. | P2 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

*None — Foundational codebase audit.*

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 02-dashboard-audit.md | Layout of Admin vs Specialist views and data metrics currently available in DB. |
| 03-tender-management.md | The mismatch of status values ('won' vs 'awarded') and lack of deep data linking. |
| 04-project-management.md | Missing PO line items and delivery receipts in the database implementation. |
| 05-workflow.md | Blocked tender-to-project transition due to backend status query bug. |
| 07-premium-ui.md | Redundant component libraries and styled components vs native popups. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/server/tenders.ts
apps/tracker/src/server/purchase-orders.ts
apps/tracker/src/server/projects.ts
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/app/(dashboard)/projects/[id]/page.tsx
apps/tracker/src/components/shared/navigation/app-sidebar.tsx
```

### New Files Required

```
apps/tracker/src/components/purchase-orders/po-line-items.tsx
apps/tracker/src/components/purchase-orders/delivery-note-dialog.tsx
apps/tracker/src/components/purchase-orders/delivery-note-list.tsx
```

### Database Changes

- [ ] Ensure proper foreign key constraints between `purchase_order_delivery_item` and line items.
- [ ] Add index on `purchase_order.projectId` and `purchase_order_line_item.purchaseOrderId` for query performance.

### API Changes

- [x] Correct tender status filter checking from `'won'` to `'awarded'`.
- [ ] Add API/actions: `getPOLineItems`, `createPOLineItems`, `createDeliveryNote`, `getDeliveryNotes`.

---

## Open Questions

- [ ] Should site supervisors (`member` role) be allowed to create delivery notes, or only read purchase orders?
- [ ] Do we support multi-currency values for tenders and awards, or is ZAR (South African Rand) hardcoded as the default currency?

---

## Appendix

### Research Sources

- Drizzle ORM Documentation: Left joins and relation queries for relational databases.
- Better Auth Documentation: Role-Based Access Control and custom permission validations.
