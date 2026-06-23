# Findings – 04-project-management.md

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 04-project-management.md |
| **Date** | 2026-06-14 |
| **Auditor** | Antigravity |
| **Scope** | Audit of active project tracking, project details, and the purchase order delivery flow. |
| **Depends On** | 01-codebase-audit.md, 02-dashboard-audit.md |

---

## Executive Summary

The **Project Management** module is the most incomplete section of the Tracker app. While the database schema defines complex tables for purchase order line items, delivery notes, and delivery items, the application UI and server APIs do not support these features. 

The project detail page only displays basic metadata, and it lacks lists of associated Purchase Orders or contract details. The Purchase Order system is restricted to basic metadata and a simple status toggle, with no way to add line items or track partial delivery quantities.

**Overall Score: 4.0/10**

| Area | Score | Trend |
|------|-------|-------|
| Project Overview & Mini Dashboard | 3.0/10 | ↓ |
| Project Register Table | 6.0/10 | → |
| Project Detail Page | 4.0/10 | ↓ |
| Purchase Order & Delivery Management | 3.0/10 | ↓ |

---

## Current State

### What Exists Today

1. **Project Register List (`project-list.tsx`):**
   - Renders fields: Project Number, Client Name, Status Badge, and Creation Date.
   - Includes client-side filtering by project status.

2. **Project details (`projects/[id]/page.tsx`):**
   - Shows basic info (project number, status, description, client contact, linked tender number).
   - Sidebar renders basic creation dates.

3. **Purchase Order View (`po-details.tsx`):**
   - Shows PO number, status badge (open, sent, delivered), supplier name, total amount, description, expected delivery dates, and project number.
   - Includes buttons to mark status as "sent" or "delivered".

### Architecture Notes

- Next.js server actions manage CRUD operations for project and PO headers, but there are no actions for PO line items or delivery notes.
- Standard members are completely blocked from viewing the Purchase Orders page due to RBAC rules.

---

## Findings

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | **No PO Line Items CRUD or UI** | `purchase-orders.ts`, PO views | Users cannot input or view itemized ordered goods, rendering quantity calculations and cost tracking non-functional. | L |
| C2 | **No Delivery Note Tracking** | `purchase-orders.ts`, PO views | The delivery receipt system exists in the database schema but is unimplemented, making partial deliveries impossible to record. | L |

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | **Incomplete Project View** | `projects/[id]/page.tsx` | Linked POs, budgets, contract start/end dates, and milestone timelines are not displayed on the project page. | M |
| M2 | **Awaiting-PO Status Not Tracked** | `project-form.tsx` | The system does not flag projects that are active but have no issued Purchase Orders, leading to operational delays. | S |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | **Uppercase Enforcements** | `projects.ts#L181` | Project numbers are automatically converted to uppercase in the database, but are not capitalized in form inputs, causing UI validation friction. | S |
| m2 | **Inconsistent PO Statuses** | `po-details.tsx#L56` | The UI only supports statuses `'open'`, `'sent'`, and `'delivered'`, while the business requirements mandate stages like Awaiting Delivery and Partially Delivered. | S |

---

## Recommendations

### Quick Wins (1-2 days)

1. **Auto-Capitalize Inputs**
   - **What**: Force text capitalization in the Project Number input field as the user types.
   - **Where**: `apps/tracker/src/components/projects/project-form.tsx`
   - **Expected outcome**: Unified styling between inputs and database records.

2. **Add PO Statuses in Code**
   - **What**: Update the PO status type definitions to support the full lifecycle: `draft`, `issued`, `awaiting_delivery`, `partially_delivered`, `delivered`, `completed`, `cancelled`, and `disputed`.
   - **Where**: `apps/tracker/src/lib/validations/purchase-order.ts`
   - **Expected outcome**: Support for complex delivery stages.

### Short-Term (1-2 weeks)

1. **Build the Projects & PO Mini Dashboard**
   - **What**: Create an operational dashboard for the Projects section that highlights active projects, total contract values, open PO counts, and overdue shipments.
   - **Where**: `apps/tracker/src/app/(dashboard)/projects/overview/page.tsx`
   - **Expected outcome**: Quick access to project health.

2. **Implement PO Line Items Input Grid**
   - **What**: Add a dynamic table grid to the PO creation form that allows users to add multiple line items (Description, Qty, Unit Price).
   - **Where**: `apps/tracker/src/components/purchase-orders/po-form.tsx`
   - **Expected outcome**: Itemized order support.

### Medium-Term (1-3 months)

1. **Build the Partial Delivery Note Capture Modal**
   - **What**: Create a delivery receipt module. When a shipment arrives, users enter a Delivery Note Number and input quantities received for each line item, updating outstanding balances and PO statuses dynamically.
   - **Where**: `apps/tracker/src/components/purchase-orders/delivery-note-dialog.tsx` (new file)
   - **Expected outcome**: Complete, audit-ready materials tracking on construction sites.

---

## Component Inventory

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| **Project Details** | Metadata card only. | Add tabs for Info, Purchase Orders, and Contract Milestones. | P0 |
| **PO Details** | Metadata text fields. | Add PO Line Items table and Delivery Note receipt logs. | P0 |
| **Project Form** | Text fields. | Pre-populate fields automatically when linked to a tender. | P1 |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| 01-codebase-audit.md | Discovered missing line items in server functions and schemas. |
| 02-dashboard-audit.md | Structure of general system user alerts. |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| 05-workflow.md | Mapping PO delivery status updates back to the project progress bar. |
| 09-forms-data-capture.md | Form validation for partial quantities and delivery note numbers. |
| 10-deliverables-roadmap.md | Scheduling the delivery module implementation. |

---

## Implementation Notes

### Affected Files

```
apps/tracker/src/components/purchase-orders/po-details.tsx
apps/tracker/src/components/purchase-orders/po-form.tsx
apps/tracker/src/app/(dashboard)/projects/[id]/page.tsx
apps/tracker/src/server/purchase-orders.ts
```

### New Files Required

```
apps/tracker/src/components/purchase-orders/po-line-items-grid.tsx
apps/tracker/src/components/purchase-orders/delivery-receipt-modal.tsx
```

### Database Changes

- [ ] Add foreign key indexes to speed up line item queries.

### API Changes

- [ ] Add `getPOLineItems` server action.
- [ ] Add `createDeliveryNote` and `receiveDeliveryItems` server actions.
