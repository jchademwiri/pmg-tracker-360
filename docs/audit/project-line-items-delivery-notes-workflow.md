# Project Line Items and Delivery Notes Workflow

## Current Implementation Audit

Before this update, Tracker had purchase orders linked to projects and PO-owned line items in `purchase_order_line_item`. Delivery notes existed as records linked to a PO, and the PO details page recorded delivery notes in a modal. There was no separate saved project line-item catalog, so PO lines could be typed directly on the PO and were not enforceably scoped to the selected project.

## Updated Workflow

### Project-Based Saved Line Items

Saved line items now live in `project_line_item`.

Each saved line item belongs to:

- one organization
- one project
- a description
- a unit
- a unit price

For now, saved line items must be project-specific. Ad hoc or unassigned saved line items are intentionally not supported.

### Purchase Orders

When creating or editing a PO:

- the user selects the project first
- the PO form loads saved line items for only that project
- changing the project clears selected PO line items
- each PO line must reference a saved project line item
- the PO snapshots description, unit, unit price, quantity, and subtotal
- the server validates that every submitted saved line item belongs to the PO project

Users cannot save a PO line item from an unrelated project.

### Delivery Notes

Delivery note recording now happens on:

`/projects/purchase-orders/[id]/deliveries/new`

The PO details page links to this route instead of opening a modal. The dedicated page shows the related project and PO, lists applicable PO line items, accepts delivered quantities, and saves a delivery note linked to both the PO and project.

## Terminology

- `quantity`: number of physical units ordered on the PO line
- `deliveredQuantity`: number of physical units delivered on a delivery note
- `unitPrice`: saved price per unit, snapshotted from the saved project line item onto the PO line
- `lineTotal`: PO quantity multiplied by unit price
- `deliveryValue`: delivered quantity multiplied by unit price

Do not use "amount" for physical delivered units.

## Calculation Pattern

The app continues to treat PO line totals as VAT-exclusive and displays VAT at 15% where existing PO screens already do so.

Delivery value is calculated per delivery item:

`deliveryValue = deliveredQuantity * unitPrice`

The server stores the calculated value on `purchase_order_delivery_item.delivery_value`.

## Database Changes

Added:

- `project_line_item`
- `purchase_order_line_item.project_line_item_id`
- `purchase_order_line_item.unit`
- `purchase_order_delivery_note.project_id`
- `purchase_order_delivery_item.unit_price`
- `purchase_order_delivery_item.delivery_value`

Migration file:

- `packages/db/migrations/0024_project_line_items_delivery_pages.sql`

Migration risk:

- Existing PO line items did not originate from a saved project line-item catalog. Their `project_line_item_id` is left nullable for historical compatibility.
- New create/update validation requires a saved project line item for PO lines.
- Existing delivery notes are backfilled with the PO's project ID.
- Existing delivery items are backfilled with unit price and delivery value from their PO line item.

## Affected Code

Schema:

- `packages/db/src/schema.ts`

Server actions and validation:

- `apps/tracker/src/server/purchase-orders.ts`
- `apps/tracker/src/lib/validations/purchase-order.ts`

Routes and UI:

- `apps/tracker/src/components/purchase-orders/po-form.tsx`
- `apps/tracker/src/components/purchase-orders/po-details.tsx`
- `apps/tracker/src/components/purchase-orders/delivery-note-form.tsx`
- `apps/tracker/src/app/(dashboard)/projects/purchase-orders/[id]/deliveries/new/page.tsx`
- `apps/tracker/src/app/(dashboard)/projects/purchase-orders/[id]/edit/page.tsx`

